var objects;
(function (objects) {
    /*
Keyboard Controls
Source file	name:       keyboardcontrols.ts
Author’s name:	        George Savcheko and Jason Gunter
Last modified by:       Jason Gunter
Date last modified:     2016-03-16
Program	description:    Create your own simple First Person Perspective game. The game must include hazards for the player to avoid. A scoring
                        system must also be included. You must build your own graphic and sound assets. You must use ThreeJS and a JavaScript
                        Physics Engine to build your game.
Revision history:       added comments and some keyboard functionality
THREEJS Aliases
*/
    // MouseControls Class +++++++++++++++
    var MouseControls = (function () {
        // CONSTRUCTOR +++++++++++++++++++++++
        function MouseControls() {
            this.enabled = false;
            this.sensitivity = 0.1;
            this.yaw = 0;
            this.pitch = 0;
            document.addEventListener('mousemove', this.OnMouseMove.bind(this), false);
        }
        // PUBLIC METHODS +++++++++++++++++++++
        MouseControls.prototype.OnMouseMove = function (event) {
            this.yaw = -event.movementX * this.sensitivity;
            this.pitch = -event.movementY * this.sensitivity * 0.01;
        };
        return MouseControls;
    })();
    objects.MouseControls = MouseControls;
})(objects || (objects = {}));
//# sourceMappingURL=mousecontrols.js.map