module objects {
/* 
Mouse Controls
Source file	name:       mousecontrols.ts
Author’s name:	        George Savcheko and Jason Gunter
Last modified by:       George Savchenko
Date last modified:     2016-03-25
Program	description:    Create your own simple First Person Perspective game. The game must include hazards for the player to avoid. A scoring
                        system must also be included. You must build your own graphic and sound assets. You must use ThreeJS and a JavaScript 
                        Physics Engine to build your game. 
Revision history:       fixed comments
*/
    // MouseControls Class +++++++++++++++
    export class MouseControls {
        // PUBLIC INSTANCE VARIABLES +++++++++
        public sensitivity: number;
        public yaw: number; // look left and right - x-axis
        public pitch: number; // look up and down - y-axis
        public enabled: boolean;
        // CONSTRUCTOR +++++++++++++++++++++++
        constructor() {
            this.enabled = false;
            this.sensitivity = 0.1;
            this.yaw = 0;
            this.pitch = 0;
            
            document.addEventListener('mousemove', this.OnMouseMove.bind(this), false);
        }
        
        // PUBLIC METHODS +++++++++++++++++++++
        public OnMouseMove(event: MouseEvent):void {
            this.yaw = -event.movementX * this.sensitivity;
            
            this.pitch = -event.movementY * this.sensitivity * 0.01;
        }
    }
}