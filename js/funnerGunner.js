//
// funnerGunner.js
// Alexander Rutan
//

//simple game with a single moving ball
var scene;
var ball;
var player;
var bullet = [];
var maxBullets = 10;
var currentBullets = 0;
var fired = false; //check if fired this frame.

var rotateSpeed = 1;
var ballSpeed = 0;
var bulletSpeed = 5;

function Bullet(positionX, positionY, angle, velocity){
	this.sprite = new Sprite(scene,"redBall.png",20,20)
	this.sprite.setBoundAction(DIE);
	this.sprite.setPosition(positionX, positionY);
	this.sprite.setMoveAngle(angle);
	this.sprite.setSpeed(velocity);
	this.dead = false;
	
	this.update = function(){
		this.sprite.update();
		if(this.sprite.visible == false){
			this.dead = true;
		}
	}
}
  
function FreeCamera(){
	this.x = 0;
	this.y = 0;
	
	this.update = function(){
		
	}
}
  
function init(){
	scene = new Scene();
	ball = new Sprite(scene, "redBall.png", 50, 50);
	ball.setBoundAction(CONTINUE);
	ball.setPosition(scene.width/2, scene.height/2); //put ball in middle of screen
    ball.setMoveAngle(180);
	ball.setSpeed(ballSpeed);
	
	//Free cam for debugging. Send player as paramater normally.
	camParent = new FreeCamera();
	camera = new Camera(scene, camParent);
	scene.start();
} // end init

function fire(){
	if(currentBullets < maxBullets){		
		bullet.push(new Bullet(ball.x, ball.y, ball.getMoveAngle(), bulletSpeed));
		console.log(bullet); //debug
		currentBullets++;
	}
}

function input(){
	//Space bar for fire
	if(keysDown[K_SPACE] == true && fired == false){
		fired = true;
		fire();
	}
	if(keysDown[K_SPACE] == false && fired == true){
		fired = false;
	}
	
	//Left and Right keys for rotating
	if(keysDown[K_LEFT] == true){
		ball.turnBy(rotateSpeed * -1);
	}
	if(keysDown[K_RIGHT] == true){
		ball.turnBy(rotateSpeed);
	}
	
	//Move camera with WASD
	if(keysDown[K_W] == true){
		camParent.y = camParent.y - 1;
	}
	if(keysDown[K_S] == true){
		camParent.y = camParent.y + 1;
	}
	if(keysDown[K_A] == true){
		camParent.x = camParent.x - 1;
	}
	if(keysDown[K_D] == true){
		camParent.x = camParent.x + 1;
	}
}

	
function update(){
	input();
    scene.clear();
	camera.update();
	//ball camera
	//ball.x = (scene.width/2) - camera.x;
	//ball.y = (scene.height/2) - camera.y;
	//end ball camera
    ball.update();
	for(i = 0; i < bullet.length; i++){
		//remove from array if it has "died".
		if(bullet[i].dead == true){
			bullet.splice(i, 1);
			currentBullets--;
		}
		else{
			bullet[i].update();
		}

	}
} // end update