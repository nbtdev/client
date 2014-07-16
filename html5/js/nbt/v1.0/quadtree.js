/****************************************************************************
This source file is (c) NetBattleTech. All rights reserved. 
Redistribution and/or reproduction, in whole or in part, without prior
written permission of a duly authorized representative of NetBattleTech
is prohibited.
****************************************************************************/

function QuadTreeNode(dims) {
	this.mDimensions = dims;
	this.mObjects = null;
	this.mNumObjects = 0;
	this.mChildren = null;
}

QuadTreeNode.prototype.insert = function(data) {
	var left = this.mDimensions.left;
	var right = this.mDimensions.right;
	var top = this.mDimensions.top;
	var bottom = this.mDimensions.bottom;
	
	// if x and y are within our bounds...
	if (left < data.x && data.x < right && bottom < data.y && data.y < top) {
		// ...and this node has no data...
		if (this.mNumObjects == 0) {
			if (this.mChildren == null) {
				// ... then just put the data here and return
				this.mObjects = new Array(5);
				this.mObjects[this.mNumObjects++] = data;
				return true;
			}
			else {
				// find a child hierarchy to keep this data
				for (var i=0; i<4; ++i) {
					if (this.mChildren[i].insert(data))
						return true;
				}
			}
		}
		else {
			if (this.mNumObjects < 4) {
				// then just add it to the list and return
				this.mObjects[this.mNumObjects++] = data;
				return true;
			}
			else {
				// we'll have to split this node into 4 (and move the current data into 
				// one of them) and then figure out which one gets the current and new data
				var centerX = left + (right - left) / 2;
				var centerY = bottom + (top - bottom) / 2;
				
				this.mChildren = [
				                  // "upper left"
				                  new QuadTreeNode({
				                	  left: left,
				                	  right: centerX,
				                	  top: top,
				                	  bottom: centerY
				                  }),
				                  // "upper right"
				                  new QuadTreeNode({
				                	  left: centerX,
				                	  right: right,
				                	  top: top,
				                	  bottom: centerY
				                  }),
				                  // "lower left"
				                  new QuadTreeNode({
				                	  left: left,
				                	  right: centerX,
				                	  top: centerY,
				                	  bottom: bottom
				                  }),
				                  // "lower right"
				                  new QuadTreeNode({
				                	  left: centerX,
				                	  right: right,
				                	  top: centerY,
				                	  bottom: bottom
				                  })
				                 ];
				
				// then insert this node's data into one of the children; first add
				// the new data to the array so it can also be processed
				this.mObjects[this.mNumObjects] = data;
				
				while (this.mNumObjects > 0) {
					var obj = this.mObjects[this.mNumObjects--];
					
					for (var i=0; i<4; ++i) {
						if (this.mChildren[i].insert(obj)) {
							break;
						}
					}
				}
				
				this.mObjects = null;
				return true;
			}
		}
	}
	
	// if outside our bounds, ignore...
	return false;
}

QuadTreeNode.prototype.find = function(x, y) {
	// eliminate futile searching of 3/4 of the descendants by
	// simply picking the right starting quadrant up front...
	
	var left = this.mDimensions.left;
	var right = this.mDimensions.right;
	var top = this.mDimensions.top;
	var bottom = this.mDimensions.bottom;
	var centerX = left + (right - left) / 2;
	var centerY = bottom + (top - bottom) / 2;
	
	if (this.mChildren != null) {
		var child = null;
		
		if (x < centerX) {
			if (y < centerY) {
				// lower left (2)
				child = this.mChildren[2];
			}
			else {
				// upper left (0)
				child = this.mChildren[0];
			}
		}
		else {
			if (y < centerY) {
				// lower right (3)
				child = this.mChildren[3];
			}
			else {
				// upper right (1)
				child = this.mChildren[1];
			}
		}
		
		return child.find(x, y);
	}
	else {
		// it's one of our objects, check each one for manhattan distance from the target coords
		for (var i=0; i<this.mNumObjects; ++i) {
			var dx = Math.abs(x - this.mObjects[i].x);
			var dy = Math.abs(y - this.mObjects[i].y);
			if ((dx+dy) < 1.5) {
				return this.mObjects[i];
			}
		}
		
		return null;
	}
}

function QuadTree(dims) {
	this.mDimensions = dims;
	this.mRoot = new QuadTreeNode({
		left: dims.left,
		right: dims.right,
		top: dims.top,
		bottom: dims.bottom
	});
}

QuadTree.prototype.insert = function(data) {
	this.mRoot.insert(data);
}

QuadTree.prototype.find = function(x, y) {
	return this.mRoot.find(x, y);
}
