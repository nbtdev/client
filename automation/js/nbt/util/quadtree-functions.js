/**
 Copyright (c) 2017, Netbattletech
 All rights reserved.

 Redistribution and use in source and binary forms, with or without modification, are
 permitted provided that the following conditions are met:

 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
 EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL
 THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT
 OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
 TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

quadtreeNode_find = function(quadtreeNode, x, y) {
    // eliminate futile searching of 3/4 of the descendants by
    // simply picking the right starting quadrant up front...

    var left = quadtreeNode.mDimensions.left;
    var right = quadtreeNode.mDimensions.right;
    var top = quadtreeNode.mDimensions.top;
    var bottom = quadtreeNode.mDimensions.bottom;
    var centerX = left + (right - left) / 2;
    var centerY = bottom + (top - bottom) / 2;

    if (quadtreeNode.mChildren != null) {
        var child = null;

        if (x < centerX) {
            if (y < centerY) {
                // lower left (2)
                child = quadtreeNode.mChildren[2];
            }
            else {
                // upper left (0)
                child = quadtreeNode.mChildren[0];
            }
        }
        else {
            if (y < centerY) {
                // lower right (3)
                child = quadtreeNode.mChildren[3];
            }
            else {
                // upper right (1)
                child = quadtreeNode.mChildren[1];
            }
        }

        return child.find(x, y);
    }
    else {
        // it's one of our objects, check each one for manhattan distance from the target coords
        for (var i=0; i<quadtreeNode.mNumObjects; ++i) {
            var dx = Math.abs(x - quadtreeNode.mObjects[i].x);
            var dy = Math.abs(y - quadtreeNode.mObjects[i].y);
            if ((dx+dy) < 1.5) {
                return quadtreeNode.mObjects[i];
            }
        }

        return null;
    }
};

quadtreeNode_addAllObjects = function(quadtreeNode, arr) {
    if (quadtreeNode.mObjects) {
        quadtreeNode.mObjects.forEach(function(elem, idx, array) {
            arr.push(elem);
        });
    }
    else {
        // collect objects from the kiddies
        if (quadtreeNode.mChildren) {
            quadtreeNode.mChildren.forEach(function(elem, idx, array) {
                quadtreeNode_addAllObjects(elem, arr);
            });
        }
    }
};

quadtreeNode_findAllWithinBox = function(quadtreeNode, l, r, b, t, objs) {
    var left = quadtreeNode.mDimensions.left;
    var right = quadtreeNode.mDimensions.right;
    var top = quadtreeNode.mDimensions.top;
    var bottom = quadtreeNode.mDimensions.bottom;
    var centerX = left + (right - left) / 2;
    var centerY = bottom + (top - bottom) / 2;

    // check to see if the test box intersects us; if not, early out
    if (!(left < r && right > l && bottom < t && top > b))
        return;

    // if we are fully enclosed, add all objects
    if (l < left && r > right && b < bottom && t > top) {
        quadtreeNode_addAllObjects(quadtreeNode, objs);
    }
    else {
        // try each child node, if any
        if (quadtreeNode.mChildren) {
            quadtreeNode.mChildren.forEach(function(elem, idx, array) {
                quadtreeNode_findAllWithinBox(elem, l, r, b, t, objs);
            });
        }

        // and then our own objects, if any
        if (quadtreeNode.mObjects) {
            quadtreeNode.mObjects.forEach(function(elem, idx, array) {
                if (l < elem.x && r > elem.x && b < elem.y && t > elem.y)
                    objs.push(elem);
            });
        }
    }
};

quadtreeNode_findAllWithinRadiusEx = function(quadtreeNode, center, radius, objs, filterCb) {
    // first do a simple box collection...
    var left = center.x - radius;
    var right = center.x + radius;
    var bottom = center.y - radius;
    var top = center.y + radius;

    var tmp = [];
    quadtreeNode_findAllWithinBox(quadtreeNode, left, right, bottom, top, tmp);

    // ... then prune those not within the specified radius; additionally, call the filter callback
    // for each
    var radSqr = radius * radius;
    tmp.forEach(function(e,i,a) {
        var x = center.x - e.x;
        var y = center.y - e.y;
        var distSqr = x*x + y*y;
        if (distSqr < radSqr) {
            if (filterCb && filterCb(e))
                objs.push({planet: e, radius: Math.sqrt(distSqr)});
        }
    });

    return objs;
};

quadtreeNode_findAllWithinRadius = function(quadtreeNode, center, radius, objs) {
    quadtreeNode_findAllWithinRadiusEx(quadtreeNode, center, radius, objs);
};

quadtree_find = function(quadtree, x, y) {
    return quadtreeNode_find(quadtree.mRoot, x, y);
};

quadtree_findAllWithinBox = function(quadtree, left, right, bottom, top) {
    var objs = [];
    quadtreeNode_findAllWithinBox(quadtree.mRoot, left, right, bottom, top, objs);
    return objs;
};

quadtree_findAllWithinRadiusEx = function(quadtree, center, radius, filterCb) {
    var objs = [];
    quadtreeNode_findAllWithinRadiusEx(quadtree.mRoot, center, radius, objs, filterCb);
    return objs;
};

quadtree_findAllWithinRadius = function(quadtree, center, radius) {
    var objs = [];
    quadtreeNode_findAllWithinRadius(quadtree.mRoot, center, radius, objs);
    return objs;
};
