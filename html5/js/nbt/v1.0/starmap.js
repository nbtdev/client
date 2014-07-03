/**
 * 
 */

function Starmap(planetData, canvas) {
	// array of "Planet" objects containing all per-planet information
	this.planets = planetData;
	
	// GL canvas
	this.canvas = canvas;
	
	// GL context
	this.gl = null;
	
	// ortho camera
	this.projMat = null;
	
	// model (world) matrix
	this.worldMat = null;
	
	// view (camera) matrix
	this.viewMat = null;
	
	// circle object (used a lot...)
	this.circle = null;

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
	this.view = null;
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
	
	// mouse scroll handler
	this.scrollHandler = function(event) {
		var self = event.data.self;
		
		var newZ = self.camPos[2] - event.originalEvent.wheelDelta;
		if (newZ > 9 && newZ < 2001) {
			self.camPos[2] -= event.originalEvent.wheelDelta;
			mat4.lookAt(self.viewMat, self.camPos, [self.camPos[0],self.camPos[1],0], [0,1,0]);
			self.draw();
		}
	}
	
	this.mouseDownHandler = function (event) {
		var self = event.data.self;
		
		if (event.button == 0) {
			// then selecting/rubber-banding
			self.mouseDownPos = {x: event.clientX, y: event.clientY};
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
			// then done selecting/rubber-banding
			
			// TODO: raycast to see if a planet was selected
			self.draw();
			self.drawCircle(self.mouseDownPos);
			
			self.mouseDownPos = null;
		}
		else if (event.button == 1) {
			// then done moving the map
			self.mapMoveStartPos = null;
		}
	}
	
	this.mouseMoveHandler = function (event) {
		var self = event.data.self;
		
		if (self.mapMoveStartPos != null) {
			// then we are moving the map, calculate the delta relative to the mouse-down position
			var deltaX = self.mapMoveLastPos.x - event.clientX;
			var deltaY = self.mapMoveLastPos.y - event.clientY;
			self.mapMoveLastPos = {x: event.clientX, y: event.clientY};
			
			// update the modelview matrix with this info
			self.camPos[0] += deltaX;
			self.camPos[1] -= deltaY;
			
			mat4.lookAt(self.viewMat, self.camPos, [self.camPos[0],self.camPos[1],0], [0,1,0]);
			self.draw();
		}
		
		if (self.mouseDownPos != null) {
			// then we are selecting stuff with some form of rubber band
		}
	}
}

Starmap.prototype.vertexShader = 
	"attribute vec3 pos;\n" +
	"uniform mat4 proj;\n" +
	"uniform mat4 world;\n" +
	"uniform mat4 view;\n" +
	"void main() {\n" +
	"	gl_Position = proj * world * view * vec4(pos, 1.0);\n" +
	"}";

Starmap.prototype.fragmentShader = 
	"uniform mediump vec3 col;" +
	"void main() {\n" + 
	"	gl_FragColor = vec4(col, 1.0);\n" +
	"}";

Starmap.prototype.init = function(args) {
	var container = args.container;
	
	this.vp = new Object();
	this.vp.x = 0;
	this.vp.y = 0;
	this.vp.width = window.innerWidth * 0.8;
	this.vp.height = window.innerHeight * 0.9;
	
	// move canvas into container
	container.append($(this.canvas));
	$(this.canvas).show();
	
	$(this.canvas).width(this.vp.width);
	$(this.canvas).height(this.vp.height);
	this.canvas.width = this.vp.width;
	this.canvas.height = this.vp.height;
	
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
		GL.depthFunc(GL.LEQUAL);
		GL.clear(GL.COLOR_BUFFER_BIT|GL.DEPTH_BUFFER_BIT);
		
		this.projMat = mat4.create();
		//mat4.ortho(this.camMat, 0, this.canvas.clientWidth, 0, this.canvas.clientHeight, 0.1, 10000);
		mat4.perspective(this.projMat, Math.PI/2, this.canvas.clientWidth/this.canvas.clientHeight, 10, 10000);
		
		this.viewMat = mat4.create();
		this.worldMat = mat4.create();
		mat4.identity(this.worldMat);
		mat4.identity(this.viewMat);
		mat4.lookAt(this.viewMat, this.camPos, [this.camPos[0],this.camPos[1],0], [0,1,0]);
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
		GL.uniformMatrix4fv(this.proj, false, this.projMat);
		this.world = GL.getUniformLocation(this.program, "world");
		GL.uniformMatrix4fv(this.world, false, this.worldMat);
		this.view = GL.getUniformLocation(this.program, "view");
		GL.uniformMatrix4fv(this.view, false, this.viewMat);
		this.col = GL.getUniformLocation(this.program, "col");
	}

	// kick off requests for map data
	if (!args._this.mapColors) {
		$.ajax({
			url: API.call(location.hostname, "system", "mapColors"),
			type: "GET",
			data: JSON.stringify(args.token)
		}).error(function(msg) {
			alert(msg);
		}).success( function(data) {
			var resp = JSON.parse(data);
			
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
	
	$(window).on("mousewheel DOMMouseScroll", {self: this}, this.scrollHandler);
	$(window).on("mousedown", {self: this}, this.mouseDownHandler);
	$(window).on("mouseup", {self: this}, this.mouseUpHandler);
	$(window).on("mousemove", {self: this}, this.mouseMoveHandler);
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
	// center positions, and we can multiply that by 36 (center plus 35 circumference verts)
	// to give us the total number of floats needed 
	var arrayLen = this.planets.length * 3 * 37;
	var arr = new Float32Array(arrayLen);
	var indices = null;

	var i = 0;
	var idx = 0;
	var offset = 0;
	var currentOwner = null;
	
	for (var p=0; p<this.planets.length; ++p) {
		var owner = this.planets[p].owner; 
		if (owner !== currentOwner) {
			if (currentOwner !== null) {
				var ibo = GL.createBuffer();
				GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, ibo);
				GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), GL.STATIC_DRAW);
				
				var vbo = GL.createBuffer();
				GL.bindBuffer(GL.ARRAY_BUFFER, vbo);
				GL.bufferData(GL.ARRAY_BUFFER, arr.subarray(0, i-1), GL.STATIC_DRAW);
				
				var obj = new Object();
				obj.ibo = ibo;
				obj.vbo = vbo;
				obj.offset = offset;
				obj.length = indices.length;
				obj.owner = this.planets[p].owner;

				this.ibo[this.planets[p].owner] = obj;
				this.ibo.length++;

				offset += indices.length;
				i = 0;
			}
			
			currentOwner = this.planets[p].owner;
			indices = [];
			idx = 0;
		}
		
		for (var angle=0.0; angle<360.0;) {
			var rad = angle / 180.0 * Math.PI;
			
			// vert 0 of this triangle
			arr[i++] = this.planets[p].x;
			arr[i++] = this.planets[p].y;
			arr[i++] = 0.0;
			indices.push(idx++);
			
			// vert 1 of this triangle
			arr[i++] = this.planets[p].x + Math.sin(rad) * radius;
			arr[i++] = this.planets[p].y + Math.cos(rad) * radius;
			arr[i++] = 0.0;
			indices.push(idx++);
			
			angle += 10.0;
			rad = angle / 180.0 * Math.PI;
			
			// vert 2 of this triangle
			arr[i++] = this.planets[p].x + Math.sin(rad) * radius;
			arr[i++] = this.planets[p].y + Math.cos(rad) * radius;
			arr[i++] = 0.0;
			indices.push(idx++);
		}
	}
	
	// init circle object (TODO: LoD versions?)
	// this is a unit circle that gets scaled when drawn; circle is made up of 360 segments (one per degree)
	this.circle = new Object();
	
	var circleVbo = GL.createBuffer();
	var circleIbo = GL.createBuffer();
	
	GL.bindBuffer(GL.ARRAY_BUFFER, circleVbo);
	GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, circleIbo);

	var density = 2; /*because when zooming in, it's a dashed line instead of solid*/
	var nSegments = 361 /*vertices in the circle*/ * density;
	
	var segments = new Float32Array(nSegments * 3 /*3 floats per vertex*/);
	var ind = new Uint16Array(nSegments);
	
	var i = 0;
	for (var idx=0; idx<nSegments; idx++) {
		segments[i++] = Math.sin((idx/density)/180.0*Math.PI);
		segments[i++] = Math.cos((idx/density)/180.0*Math.PI);
		segments[i++] = 0;
		ind[idx] = idx;
	}
	
	GL.bufferData(GL.ARRAY_BUFFER, segments, GL.STATIC_DRAW);
	GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, ind, GL.STATIC_DRAW);
	
	this.circle.vbo = circleVbo;
	this.circle.ibo = circleIbo;
	this.circle.ibo.length = ind.length;
	
	this.draw();
}

Starmap.prototype.draw = function() {
	var GL = this.gl;
	
	GL.viewport(0, 0, this.vp.width, this.vp.height);
	GL.clear(GL.COLOR_BUFFER_BIT|GL.DEPTH_BUFFER_BIT);
	
	var tmp = mat4.create();
	//GL.uniformMatrix4fv(this.proj, false, mat4.transpose(tmp, this.camMat));
	//GL.uniformMatrix4fv(this.wv, false, mat4.transpose(tmp, this.mv));
	GL.uniformMatrix4fv(this.proj, false, this.projMat);
	GL.uniformMatrix4fv(this.world, false, this.worldMat);
	GL.uniformMatrix4fv(this.view, false, this.viewMat);

	var _this = this;
	
	$.each(this.ibo, function(k, v) {
		var iboData = v;
		
		if (iboData instanceof Object) {
			var mapCol = _this.mapColors[iboData.owner];

			if (mapCol) {
				GL.uniform3fv(_this.col, [mapCol.innerColor.r/255.0, mapCol.innerColor.g/255.0, mapCol.innerColor.b/255.0]);
			}
			
			GL.bindBuffer(GL.ARRAY_BUFFER, iboData.vbo);
			
			GL.enableVertexAttribArray(0);
			GL.vertexAttribPointer(0, 3, GL.FLOAT, false, 3 * 4, 0);
			
			GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, iboData.ibo);

			GL.drawElements(GL.TRIANGLES, iboData.length/3, GL.UNSIGNED_SHORT, 0);
		}
	});
}

Starmap.prototype.drawCircle = function(pos) {
	var GL = this.gl;
	
	// for now, draw circle of 60 radius at center of map
	var world = mat4.create();
	mat4.identity(world);
	
	mat4.scale(world, world, [30,30,1]);
	GL.uniformMatrix4fv(this.world, false, world);

	GL.bindBuffer(GL.ARRAY_BUFFER, this.circle.vbo);
	
	GL.enableVertexAttribArray(0);
	GL.vertexAttribPointer(0, 3, GL.FLOAT, false, 3 * 4, 0);
	
	GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.circle.ibo);

	GL.uniform3fv(this.col, [1.0,1.0,1.0]);
	GL.drawElements(GL.LINE_STRIP, this.circle.ibo.length/3, GL.UNSIGNED_SHORT, 0);

	mat4.identity(world);
	mat4.scale(world, world, [60,60,1]);
	GL.uniformMatrix4fv(this.world, false, world);
	GL.uniform3fv(this.col, [0.0,1.0,0.0]);
	GL.drawElements(GL.LINE_STRIP, this.circle.ibo.length/3, GL.UNSIGNED_SHORT, 0);
}

Starmap.prototype.reset = function() {
	
}
