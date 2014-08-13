/**
 * 
 */

function Starmap(mapData, canvas, overlay, ui) {

	// array of "Planet" objects containing all per-planet information
	this.planets = mapData.planets;
	
	// map dimensions
	this.minX = mapData.minX;
	this.minY = mapData.minY;
	this.maxX = mapData.maxX;
	this.maxY = mapData.maxY;
	
	// quadtree for picking
	this.quadtree = null;
	
	// picking support
	this.selectedPlanet = null;
	
	// rubberbanding support
	this.selectedPlanets = null;
	
	// context menu for RMB things
	this.contextMenu = null;
	
	// GL canvas
	this.canvas = canvas;
	
	// overlay for text, etc
	this.overlay = overlay;
	
	// UI layer for menus, etc
	this.ui = ui;
	
	// GL context
	this.gl = null;
	
	// ortho camera
	this.ortho = null;
	
	// circle object (used a lot...)
	this.circle = null;
	// center of circles (30 and 60LY)
	this.circleCenter = null;
	
	// rect object for rubberbanding
	this.selectBox = null;

	// default colors to use for various things on the map
	this.mapColors = null;
	
	// VBO will contain all planet discs...
	this.vbo = null;
	
	// ...and IBO(s) will index into them...
	this.ibo = null; 
	
	// GPU program
	this.program = null;
	
	// program uniforms (for setting camera matrices)
	this.proj = null;
	this.world = null;
	this.col = null;
	
	// viewport (x, y, w, h)
	this.vp = null;
	
	// current position on Z axis
	this.camPos = [0,0,1000];
	
	// starting position for map move
	this.mapMoveStartPos = null;
	this.mapMoveLastPos = null;
	
	// starting position for rubber banding
	this.mouseDownPos = null;
	
	this.maxDist = 2001;
	this.minDist = 29;
	
	// and somewhere to store the current state
	this.state = this.State.NORMAL;
	
	//
	// user-definable callbacks
	//
	// onEditPlanet(selectedPlanet /*object*/);
	this.onEditPlanet = null;
	// onEditPlanet(selectedPlanets /*array*/);
	this.onEditPlanets = null;
	
	// mouse scroll handler
	this.scrollHandler = function(event) {
		var self = event.data.self;
		
		var newZ = self.camPos[2] - event.originalEvent.wheelDelta/4;
		
		if (newZ > 29 && newZ < 2001) {
			self.camPos[2] -= event.originalEvent.wheelDelta/4;
			
			var width = self.canvas.width;
			var height = self.canvas.height;
			var zoom = self.camPos[2] / (self.maxDist - self.minDist);
			
			var left = self.camPos[0] - (width/2 * zoom); 
			var right = self.camPos[0] + (width/2 * zoom); 
			var bottom = self.camPos[1] - (height/2 * zoom); 
			var top = self.camPos[1] + (height/2 * zoom); 
			
			mat4.ortho(self.ortho, left, right, bottom, top, -1, 1);
			self.draw();
		}
		
		if (event.stopPropagation) event.stopPropagation();
		else event.cancelBubble = true; 	
	}
	
	this.mouseDownHandler = function (event) {
		var self = event.data.self;
		
		var pos = $(self.canvas).offset();
		
		if (event.button == 0) {
			// ignore LMB events if the context menu is up
			if (self.state == self.State.CONTEXT_MENU)
				return;
			
			// then selecting/rubber-banding, clear any existing selection set
			self.selectedPlanets = null;
			
			// find a planet under the mouse?
			var relX = event.clientX - pos.left;
			var relY = event.clientY - pos.top;
			var normX = relX / $(self.canvas).width();
			var normY = 1 - relY / $(self.canvas).height();
			
			var invOrtho = mat4.create();
			mat4.invert(invOrtho, self.ortho);
			
			var v = [2*normX-1, 2*normY-1, 0];
			var pos = [0,0,0];
			vec3.transformMat4(pos, v, invOrtho);

			self.mouseDownPos = {x: pos[0], y: pos[1]};
			
			self.selectedPlanet = self.quadtree.find(pos[0], pos[1]);
			if (self.selectedPlanet != null) {
				// find planets of interest
				var found = self.quadtree.findAllWithinRadius({x: pos[0], y: pos[1]}, 60);
				
				// sort in ascending order of distance from selected
				var sorted = found.sort(function(a, b) { return a.radius - b.radius; });
				
				self.showSelectedDetail(sorted);
			}
			else {
				self.clearSelectedDetail();
			}
		}
		else if (event.button == 1) {
			// then moving the map
			self.mapMoveStartPos = {x: event.clientX, y: event.clientY};
			self.mapMoveLastPos = {x: event.clientX, y: event.clientY};
		}
	}
	
	this.mouseUpHandler = function (event) {
		var self = event.data.self;
		
		if (event.button == 0) {
			// ignore if we are in context-menu mode
			if (self.state == self.State.CONTEXT_MENU)
				return;
			
			// then done selecting/rubber-banding
			
			self.circleCenter = null;

			if (self.selectedPlanet != null) {
				self.circleCenter = self.mouseDownPos;
			}
			
			self.draw();
		
			self.mouseDownPos = null;
		}
		else if (event.button == 1) {
			// then done moving the map
			self.mapMoveStartPos = null;
		}
		else if (event.button == 2) {
			// then context menu (if no special keys pressed)
			if (self.contextMenu) {
				$(self.contextMenu).remove();
				self.contextMenu = null;
				self.state = self.State.NORMAL;
			}
			
			if (self.selectedPlanet) {
				var pos = $(self.canvas).offset();
				var eventPos = {x: event.clientX - pos.left, y: event.clientY - pos.top};
				self.contextMenu = self.editPlanetContextMenuAt(eventPos);
				self.state = self.State.CONTEXT_MENU;
			}
			
			if (self.selectedPlanets) {
				var pos = $(self.canvas).offset();
				var eventPos = {x: event.clientX - pos.left, y: event.clientY - pos.top};
				self.contextMenu = self.editPlanetsContextMenuAt(eventPos);
				self.state = self.State.CONTEXT_MENU;
			}
			
			if (event.stopPropagation) event.stopPropagation();
			else event.cancelBubble = true; 
		}
	}
	
	this.mouseMoveHandler = function (event) {
		var self = event.data.self;
		
		if (self.mapMoveStartPos != null) {
			// then we are moving the map, calculate the delta relative to the mouse-down position
			var deltaX = self.mapMoveLastPos.x - event.clientX;
			var deltaY = self.mapMoveLastPos.y - event.clientY;
			self.mapMoveLastPos = {x: event.clientX, y: event.clientY};
			
			var width = self.canvas.width;
			var height = self.canvas.height;
			var zoom = self.camPos[2] / (self.maxDist - self.minDist);

			self.camPos[0] += deltaX * zoom;
			self.camPos[1] -= deltaY * zoom;
			
			var left = self.camPos[0] - (width/2 * zoom); 
			var right = self.camPos[0] + (width/2 * zoom); 
			var bottom = self.camPos[1] - (height/2 * zoom); 
			var top = self.camPos[1] + (height/2 * zoom); 
			
			mat4.ortho(self.ortho, left, right, bottom, top, -1, 1);
			
			self.draw();
			
			if (event.stopPropagation) event.stopPropagation();
			else event.cancelBubble = true; 
		}
		
		if (self.mouseDownPos != null) {
			var offPos = $(self.canvas).offset();
			
			// then we are selecting stuff with some form of rubber band
			var relX = event.clientX - offPos.left;
			var relY = event.clientY - offPos.top;
			var normX = relX / $(self.canvas).width();
			var normY = 1 - relY / $(self.canvas).height();
			
			var invOrtho = mat4.create();
			mat4.invert(invOrtho, self.ortho);
			
			var v = [2*normX-1, 2*normY-1, 0];
			var pos = [0,0,0];
			vec3.transformMat4(pos, v, invOrtho);
			
			// collect everything inside the box
			self.selectedPlanets = null;
			
			var posA = self.mouseDownPos;
			var posB = pos;
			
			if (posA.x < posB[0]) {
				if (posA.y > posB[1]) {
					self.selectedPlanets = self.quadtree.findAllWithinBox(posA.x, posB[0], posB[1], posA.y);
				}
				else {
					self.selectedPlanets = self.quadtree.findAllWithinBox(posA.x, posB[0], posA.y, posB[1]);
				}
			}
			else {
				if (posA.y > posB[1]) {
					self.selectedPlanets = self.quadtree.findAllWithinBox(posB[0], posA.x, posB[1], posA.y);
				}
				else {
					self.selectedPlanets = self.quadtree.findAllWithinBox(posB[0], posA.x, posA.y, posB[1]);
				}
			}
			
			self.draw();
			self.drawRect(self.mouseDownPos, pos);
		}
	}
	
	this.showSelectedDetail = function(planets) {
		var dlg = $("#planet_detail_template");
		dlg.dialog("option", "height", this.canvas.height);
		dlg.dialog("open");
		
		var selectedPlanet = this.selectedPlanet;
		
		$.each(selectedPlanet, function(key, val) {
			var pattern = "#planet_detail_template_" + key;
			var item = $(pattern);
			if (item.length) {
				item.text(val);
			}
		});
		
		// neighbors
		var neighborDiv = $("#planet_neighbors", dlg);
		neighborDiv.empty();
		var table = $("<table/>");
		var tr = $("<tr/>");
		
		$("<th/>", {text: "Planet"}).appendTo(tr);
		$("<th/>", {text: "LY"}).appendTo(tr);
		$("<th/>", {text: "Owner"}).appendTo(tr);
		$("<th/>", {text: "Terrain"}).appendTo(tr);
		$("<th/>", {text: "Keys"}).appendTo(tr);

		tr.appendTo(table);
		
		planets.forEach(function(e,i,a) {
			if (e.planet.displayName !== selectedPlanet.displayName) {
				tr = $("<tr/>");
				
				$("<td/>", {text: e.planet.displayName}).appendTo(tr);
				$("<td/>", {text: e.radius.toFixed(2)}).appendTo(tr);
				$("<td/>", {text: e.planet.owner}).appendTo(tr);
				$("<td/>", {text: e.planet.terrain}).appendTo(tr);
				$("<td/>", {text: ""}).appendTo(tr);
				
				tr.appendTo(table);
			}
		});
		
		table.appendTo(neighborDiv);
	}
	
	this.clearSelectedDetail = function() {
		$("#planet_detail_template").dialog("close");
	}
}

// starmap state (used for managing context-menu state)
Starmap.prototype.State = {
	NORMAL: 0,
	CONTEXT_MENU: 1
}

Starmap.prototype.ContextMenuItemId = {
	EDIT_PLANET: 0,	
	CHANGE_PLANET_OWNER: 1	
}

Starmap.prototype.onClickContextMenuItem = function(event) {
	var self = event.data.self;
	var id = event.data.item;
	
	// do the callback
	switch (id) {
	case self.ContextMenuItemId.EDIT_PLANET:
		if (self.onEditPlanet) self.onEditPlanet(self.selectedPlanet);
		break;
	case self.ContextMenuItemId.CHANGE_PLANET_OWNER:
		if (self.onChangePlanetsOwner) self.onChangePlanetsOwner(self.selectedPlanets);
		break;
	}
	
	// then kill the menu
	$(self.contextMenu).remove();
	self.contextMenu = null;
	self.state = self.State.NORMAL;
}

Starmap.prototype.editPlanetContextMenuAt = function(pos) {
	var menu = $("<div/>", {
		class: "context_menu"
	});
	
	var table = $("<table/>", {
		width: "100%"
	});
	table.appendTo(menu);
	
	var tr = $("<tr/>", {
		class: "context_menu_item"
	});
	tr.appendTo(table);
	tr.click({
				self: this,
				item: this.ContextMenuItemId.EDIT_PLANET
			}, 
			this.onClickContextMenuItem
	);
	
	var td = $("<td/>", {
		
	}).text("Edit...");
	td.appendTo(tr);
	
	tr = $("<tr/>", {
		class: "context_menu_item"
	});
	tr.appendTo(table);
	tr.click(this, this.onClickContextMenuItem);
	
	td = $("<td/>", {
		
	}).text("Thing...");
	td.appendTo(tr);
	
	$(menu).css({top: pos.y, left: pos.x});
	$(this.ui).append(menu);
	return menu;
}

Starmap.prototype.editPlanetsContextMenuAt = function(pos) {
	var menu = $("<div/>", {
		class: "context_menu"
	});
	
	var table = $("<table/>", {
		width: "100%"
	});
	table.appendTo(menu);
	
	var tr = $("<tr/>", {
		class: "context_menu_item"
	});
	tr.appendTo(table);
	tr.click({
				self: this,
				item: this.ContextMenuItemId.CHANGE_PLANET_OWNER
			}, 
			this.onClickContextMenuItem
	);
	
	var td = $("<td/>", {
		
	}).text("Change Owner...");
	td.appendTo(tr);
	
	$(menu).css({top: pos.y, left: pos.x});
	$(this.ui).append(menu);
	return menu;
}

Starmap.prototype.vertexShader = 
	"attribute vec3 pos;\n" +
	"uniform mat4 proj;\n" +
	"uniform mat4 world;\n" +
	"void main() {\n" +
	"	gl_Position = proj * world * vec4(pos, 1.0);\n" +
	"}";

Starmap.prototype.fragmentShader = 
	"uniform mediump vec4 col;" +
	"void main() {\n" + 
	"	gl_FragColor = col;\n" +
	"}";

Starmap.prototype.init = function(args) {
	var container = args.container;

	// move canvas into container
	container.append($(this.canvas));
	container.append($(this.overlay));
	container.append($(this.ui));
	$(this.canvas).show();
	$(this.overlay).show();
	$(this.ui).show();
		
	this.reset();

	if (!this.gl) {
		try {
			this.gl = this.canvas.getContext("webgl") || this.canvas.getContext("experimental-webgl");
		} catch (e) {
			alert(e);
			this.gl = null;
		}
	}
	
	var GL = this.gl;
	if (GL) {
		GL.clearColor(0.0,0.0,0.0,1.0);
		GL.enable(GL.DEPTH_TEST);
		GL.enable(GL.BLEND);
		GL.blendFunc(GL.SRC_ALPHA, GL.ONE);
		GL.depthFunc(GL.LEQUAL);
		GL.clear(GL.COLOR_BUFFER_BIT|GL.DEPTH_BUFFER_BIT);
	}
	else {
		alert("Could not create WebGL context, starmap functionality disabled!");
	}
	
	var vs = GL.createShader(GL.VERTEX_SHADER);
	if (vs) {
		GL.shaderSource(vs, this.vertexShader);
		GL.compileShader(vs);
		
		if (!GL.getShaderParameter(vs, GL.COMPILE_STATUS)) {
            alert(GL.getShaderInfoLog(vs));
            return;
        }
	}
	
	var fs = GL.createShader(GL.FRAGMENT_SHADER);
	if (fs) {
		GL.shaderSource(fs, this.fragmentShader);
		GL.compileShader(fs);
		
		if (!GL.getShaderParameter(fs, GL.COMPILE_STATUS)) {
            alert(GL.getShaderInfoLog(fs));
            return;
        }
	}
	
	if (vs && fs) {
		this.program = GL.createProgram();
		GL.attachShader(this.program, vs);
		GL.attachShader(this.program, fs);
		GL.linkProgram(this.program);
		
		if (!GL.getProgramParameter(this.program, GL.LINK_STATUS)) {
            alert(GL.getProgramInfoLog(this.program));
            return;
        }
		
		GL.useProgram(this.program);
		
		this.proj = GL.getUniformLocation(this.program, "proj");
		GL.uniformMatrix4fv(this.proj, false, this.ortho);
		this.world = GL.getUniformLocation(this.program, "world");
		
		this.col = GL.getUniformLocation(this.program, "col");
	}

	// kick off requests for map data
	if (!args._this.mapColors) {
		$.ajax({
			url: API.call(location.hostname, "system", "mapColors"),
			type: "GET",
			headers: {
				"X-NBT-Token": token.value,
				"X-NBT-League": API.leagueId()
			}
		}).error(function(msg) {
			alert(msg);
		}).success( function(resp) {
			if (resp.error) {
				alert(resp.message);
			}
			else {
				args._this.mapColors = new Object();
				var mapColors = args._this.mapColors;
				
				for (var i=0; i<resp.data.length; ++i) {
					mapColors[resp.data[i].unitName] = resp.data[i];
				}
				
				// now that we have the map colors, initialize VBOs with 
				// planet locations and colors
				args._this.initVBO();
			}
		});
	}
	
	$(container).on("mousewheel DOMMouseScroll", {self: this}, this.scrollHandler);
	$(container).on("mousedown", {self: this}, this.mouseDownHandler);
	$(container).on("mouseup", {self: this}, this.mouseUpHandler);
	$(container).on("mousemove", {self: this}, this.mouseMoveHandler);
	
	this.quadtree = new QuadTree({
		left: this.minX,
		right: this.maxX,
		top: this.maxY,
		bottom: this.minY
	});
	
	// save callbacks, if any
	this.cbEditPlanet = args.onEditPlanet;
}

Starmap.prototype.initVBO = function() {
	var GL = this.gl;
	
	// TODO: possibly get this from map setup data too...
	var radius = 1.0;
	
	// one vertex data VBO for all planets; one IBO per planet owner
	// note -- we will just overwrite any existing array objects/data
	this.ibo = new Object();
	this.ibo.length = 0;
	
	// we can know the length of the VBO data; "planets.length" * 3 gives us the number of 
	// center positions, and we can multiply that by 37 (center plus 36 circumference verts)
	// to give us the total number of floats needed 
	var arrayLen = this.planets.length * 3 * 3 * 19;
	var arr = new Float32Array(arrayLen);
	var indices = new Uint16Array(this.planets.length * 3 * 19);

	var i = 0;
	var idx = 0;
	var currentOwner = null;
	var numPlanets = 0;
	
	for (var p=0; p<this.planets.length; ++p) {
		// insert into quadtree
		this.quadtree.insert(this.planets[p]);
		
		var owner = this.planets[p].owner; 
		if (owner !== currentOwner) {
			if (currentOwner !== null) {
				var ibo = GL.createBuffer();
				GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, ibo);
				GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, indices.subarray(0, idx), GL.STATIC_DRAW);
				
				var vbo = GL.createBuffer();
				GL.bindBuffer(GL.ARRAY_BUFFER, vbo);
				GL.bufferData(GL.ARRAY_BUFFER, arr.subarray(0, i), GL.STATIC_DRAW);
				
				var obj = new Object();
				obj.ibo = ibo;
				obj.vbo = vbo;
				obj.length = idx;
				obj.numPlanets = numPlanets;
				obj.owner = this.planets[p].owner;

				this.ibo[this.planets[p].owner] = obj;
				this.ibo.length++;
			}
			
			currentOwner = owner;
			idx = 0;
			i = 0;
			numPlanets = 0;
		}
		
		numPlanets++;
		
		for (var angle=0.0; angle<360.0;) {
			var rad = angle / 180.0 * Math.PI;
			
			// vert 0 of this triangle
			arr[i++] = this.planets[p].x;
			arr[i++] = this.planets[p].y;
			arr[i++] = 0.0;
			indices[idx] = idx++;
			
			// vert 1 of this triangle
			arr[i++] = this.planets[p].x + Math.sin(rad) * radius;
			arr[i++] = this.planets[p].y + Math.cos(rad) * radius;
			arr[i++] = 0.0;
			indices[idx] = idx++;
			
			angle += 20.0;
			rad = angle / 180.0 * Math.PI;
			
			// vert 2 of this triangle
			arr[i++] = this.planets[p].x + Math.sin(rad) * radius;
			arr[i++] = this.planets[p].y + Math.cos(rad) * radius;
			arr[i++] = 0.0;
			indices[idx] = idx++;
		}
	}
	
	// remainder
	// TODO: figure out how to remove the remainder...
	if (currentOwner !== null) {
		var ibo = GL.createBuffer();
		GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, ibo);
		GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, indices.subarray(0, idx), GL.STATIC_DRAW);
		
		var vbo = GL.createBuffer();
		GL.bindBuffer(GL.ARRAY_BUFFER, vbo);
		GL.bufferData(GL.ARRAY_BUFFER, arr.subarray(0, i), GL.STATIC_DRAW);
		
		var obj = new Object();
		obj.ibo = ibo;
		obj.vbo = vbo;
		obj.length = idx;
		obj.numPlanets = numPlanets;
		obj.owner = currentOwner;

		this.ibo[currentOwner] = obj;
		this.ibo.length++;
	}
	
	// init circle object (TODO: LoD versions?)
	// this is a unit circle that gets scaled when drawn; circle is made up of 360 segments (one per degree)
	this.circle = new Object();
	
	var circleVbo = GL.createBuffer();
	var circleIbo = GL.createBuffer();
	
	GL.bindBuffer(GL.ARRAY_BUFFER, circleVbo);
	GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, circleIbo);

	var nSegments = 361;
	
	var segments = new Float32Array(nSegments * 3 /*3 floats per vertex*/);
	var ind = new Uint16Array(nSegments);
	
	var i = 0;
	for (var idx=0; idx<nSegments; idx++) {
		segments[i++] = Math.sin(idx/180.0*Math.PI);
		segments[i++] = Math.cos(idx/180.0*Math.PI);
		segments[i++] = 0;
		ind[idx] = idx;
	}
	
	GL.bufferData(GL.ARRAY_BUFFER, segments, GL.STATIC_DRAW);
	GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, ind, GL.STATIC_DRAW);
	
	this.circle.vbo = circleVbo;
	this.circle.ibo = circleIbo;
	this.circle.ibo.length = ind.length;
	
	// init rubberband object (it's just a rect that gets scaled
	this.selectBox = new Object();
	
	var rectVbo = GL.createBuffer();
	GL.bindBuffer(GL.ARRAY_BUFFER, rectVbo);
	
	var verts = new Float32Array(6 * 3); // 3 tri's worth of verts, we'll just make a non-indexed trilist
	verts[0] = 0; verts[1] = 0; verts[2] = 0;
	verts[3] = 0; verts[4] = 1; verts[2] = 0;
	verts[6] = 1; verts[7] = 0; verts[2] = 0;

	verts[9] = 0; verts[10] = 1; verts[11] = 0;
	verts[12] = 1; verts[13] = 1; verts[14] = 0;
	verts[15] = 1; verts[16] = 0; verts[17] = 0;
	
	GL.bufferData(GL.ARRAY_BUFFER, verts, GL.STATIC_DRAW);
	this.selectBox.vbo = rectVbo;

	this.draw();
}

Starmap.prototype.draw = function() {
	var GL = this.gl;
	
	GL.viewport(0, 0, this.vp.width, this.vp.height);
	GL.clear(GL.COLOR_BUFFER_BIT|GL.DEPTH_BUFFER_BIT);

	var scale = mat4.create();
	mat4.identity(scale);
	GL.uniformMatrix4fv(this.proj, false, this.ortho);
	GL.uniformMatrix4fv(this.world, false, scale);

	var _this = this;
	var nDrawn = 0;
	var numPlanets = 0;
	var numOwners = 0;
	
	$.each(this.ibo, function(k, v) {
		var iboData = v;
		
		if (iboData instanceof Object) {
			var mapCol = _this.mapColors[iboData.owner];

			if (mapCol) {
				GL.uniform4fv(_this.col, [mapCol.innerColor.r/255.0, mapCol.innerColor.g/255.0, mapCol.innerColor.b/255.0, 1.0]);
			}
			
			GL.bindBuffer(GL.ARRAY_BUFFER, iboData.vbo);
			
			GL.enableVertexAttribArray(0);
			GL.vertexAttribPointer(0, 3, GL.FLOAT, false, 3 * 4, 0);
			
			GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, iboData.ibo);

			GL.drawElements(GL.TRIANGLES, iboData.length, GL.UNSIGNED_SHORT, 0);
			
			numPlanets += iboData.numPlanets;
		}
		
		numOwners++;
	});
	
	//console.log("numPlanets: " + numPlanets);
	//console.log("numOwners: " + numOwners);
	
	if (this.circleCenter) {
		this.drawCircle(this.circleCenter);
	}
	
	// draw any text; first, empty the overlay
	$(this.overlay).empty();
	if (this.camPos[2] < 400) {
		var self = this;
		
		$.each(this.planets, function(k, v) {
			var pos = [v.x, v.y, 0];
			var screenPos = vec3.create();
			vec3.transformMat4(screenPos, pos, self.ortho);
			
			var tx = screenPos[0];
			var ty = screenPos[1];
			
			var x = (tx + 1) / 2 * self.canvas.width;
			var y = (1 - (ty + 1) / 2) * self.canvas.height;
			
			var zoom = self.camPos[2] / (self.maxDist - self.minDist);
			var adj = 1 / zoom;
			
			if (tx > -1 && tx < 1 && ty > -1 && ty < 1) {
				var text = $("<div/>", {
					style: "top: " + y + "px; left: " + (x + adj) + "px;",
					class: "starmapOverlayText"
				});
				
				text.text(v.displayName);
				text.appendTo($(self.overlay));
			}
		});
	}
	
	// draw any selected planet highlights too
	if (this.selectedPlanets && this.selectedPlanets.length > 0) {
		// draw a white circle around each selected planet
		for (var i=0; i<this.selectedPlanets.length; ++i) {
			var planet = this.selectedPlanets[i];
			this.drawRing({x: planet.x, y: planet.y}, 1.5, [1.0,1.0,1.0,1.0]);
		}
	}
}

Starmap.prototype.drawRing = function(pos, radius, color) {
	var GL = this.gl;

	var world = mat4.create();
	mat4.identity(world);
	
	var worldPos = [pos.x, pos.y, 0];
	mat4.translate(world, world, worldPos);
	mat4.scale(world, world, [radius,radius,1]);
	GL.uniformMatrix4fv(this.world, false, world);

	GL.bindBuffer(GL.ARRAY_BUFFER, this.circle.vbo);
	
	GL.enableVertexAttribArray(0);
	GL.vertexAttribPointer(0, 3, GL.FLOAT, false, 3 * 4, 0);
	
	GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.circle.ibo);

	GL.uniform4fv(this.col, color);
	GL.drawElements(GL.LINE_STRIP, this.circle.ibo.length, GL.UNSIGNED_SHORT, 0);
}

Starmap.prototype.drawCircle = function(pos) {
	this.drawRing(pos, 30, [1.0,1.0,1.0,1.0]);
	this.drawRing(pos, 60, [0.0,1.0,0.0,1.0]);
}

// posA is where the user first pressed the mouse
Starmap.prototype.drawRect = function(posA, posB) {
	var GL = this.gl;

	var scaleX = posB[0] - posA.x; 
	var scaleY = posB[1] - posA.y; 

	var world = mat4.create();
	mat4.identity(world);
	
	var worldPos = [posA.x, posA.y, 0];
	mat4.translate(world, world, worldPos);
	mat4.scale(world, world, [scaleX,scaleY,1]);
	GL.uniformMatrix4fv(this.world, false, world);

	GL.bindBuffer(GL.ARRAY_BUFFER, this.selectBox.vbo);
	
	GL.enableVertexAttribArray(0);
	GL.vertexAttribPointer(0, 3, GL.FLOAT, false, 3 * 4, 0);

	GL.uniform4fv(this.col, [1.0,0.0,1.0,0.2]);
	GL.drawArrays(GL.TRIANGLES, 0, 6);
}

Starmap.prototype.reset = function() {
	this.camPos = [0,0,1000];

	this.vp = new Object();
	this.vp.x = 0;
	this.vp.y = 0;
	this.vp.width = window.innerWidth * 0.8;
	this.vp.height = window.innerHeight * 0.9;
	
	$(this.canvas).width(this.vp.width);
	$(this.canvas).height(this.vp.height);
	this.canvas.width = this.vp.width;
	this.canvas.height = this.vp.height;
	
	$(this.overlay).width(this.vp.width);
	$(this.overlay).height(this.vp.height);
	
	$(this.ui).width(this.vp.width);
	$(this.ui).height(this.vp.height);
	
	this.ortho = mat4.create();

	var width = this.canvas.width;
	var height = this.canvas.height;
	var zoom = this.camPos[2] / (this.maxDist - this.minDist);
	
	var left = this.camPos[0] - (width/2 * zoom); 
	var right = this.camPos[0] + (width/2 * zoom); 
	var bottom = this.camPos[1] - (height/2 * zoom); 
	var top = this.camPos[1] + (height/2 * zoom); 
	
	mat4.ortho(this.ortho, left, right, bottom, top, -1, 1);
	
	// disable default browser context menu
	$(this.canvas).on("contextmenu", function(e) { e.preventDefault(); });
	$(this.overlay).on("contextmenu", function(e) { e.preventDefault(); });
	$(this.ui).on("contextmenu", function(e) { e.preventDefault(); });
}
