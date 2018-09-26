//
// funnerGunner.js
// Alexander Rutan
//

//simple game with a single moving ball
var firstRun = true;
var gameOver = false;

var timer;
var waiter;

var scene;
var player;

var pickup;

var camera;
var hud;
var bullet = [];
var enemy = [];
var maxBullets = 10;
var currentBullets = 0;
var score = 0;
var highScore = 0;
var fired = false; //check if fired this frame.

var rotateSpeed = 1;
var playerSpeed = 3;
var bulletSpeed = 5;

function AiController(player){
	this.target = player;
	
	this.update = function(){
		for(i = 0; i < enemy.length; i++){
			if(enemy[i].aggro == true){
				enemy[i].chase(this.target);
			}
		}
	}
}

function World(height, width){
	this.tiles = [];
	
	this.initialize = function(){
		for(i = 0; i <= height; i++){
			for(j = 0; j <= width; j++){
				this.tiles.push(new Tile(scene, "ground.png", i*100, j*100));
			}
		}
	}
	
	this.update = function(){
		for(i = 0; i < this.tiles.length; i++){
			this.tiles[i].update();
		}
	}
}

//Unused. Replaced with orb, which is more fun.
function Bullet(positionX, positionY, angle, velocity, friendly){
	this.sprite = new Sprite(scene,"orb.png",20,20)
	this.sprite.loadAnimation(204,46,34,34);
	this.sprite.generateAnimationCycles();
	this.sprite.setAnimationSpeed(500);
	this.sprite.setBoundAction(DIE);
	this.sprite.setPosition(positionX, positionY);
	this.sprite.setMoveAngle(angle);
	this.sprite.setSpeed(velocity);
	this.friendly = friendly; //set false for bullets not fired by player.
	this.damage = 1;
	this.dead = false;
	
	this.update = function(){
		this.sprite.update();
		if(this.sprite.visible == false){
			this.dead = true;
		}
	}
}

function Orb(parent){
	this.parent = parent;
	this.sprite = new Sprite(scene,"orb.png",20,20)
	this.sprite.loadAnimation(204,46,34,34);
	this.sprite.generateAnimationCycles();
	this.sprite.setAnimationSpeed(500);
	this.sprite.setBoundAction(DIE);
	//this.sprite.setMoveAngle(angle);
	//this.sprite.setSpeed(velocity);		
	
	this.radius = 50;
	this.damage = 1;
	this.dead = false;
	this.sprite.setPosition(this.parent.x + this.radius, this.parent.y);
	
	this.update = function(){
		//this.sprite.x = this.parent.x + this.radius;
		//this.sprite.y = this.parent.y;
		this.sprite.setPosition(this.parent.x + this.radius, this.parent.y);
		this.sprite.update();
		if(this.sprite.visible == false){
			this.dead = true;
		}
	}
}

function Player (){
	this.x = scene.width/2;
	this.y = scene.height/2;
	
	this.sprite = new Sprite(scene, "warlock.png", 50, 50);
	this.sprite.setBoundAction(CONTINUE);
	this.sprite.setPosition(1,1); //put player in middle of screen
	this.sprite.setMoveAngle(180);
	this.sprite.setSpeed(0);
	
	this.hitPoints = 1;
	
	this.update = function(){
		this.sprite.update();
	}
	
	this.damageBy = function(amount){
		this.hitPoints -= amount;		
	}
}

function Enemy (positionX, positionY){
	this.hitPoints = 5;
	this.damageAggroThreshold = 1;
	this.speed = -1;
	this.speedModifier = 0;
	this.dead = false;
	this.aggro = true;
	this.invincible = false;
	this.knockedBack = false; this.knockedBackXenith = false;

	this.knockBackForce = 0;
	this.pointValueDead = 200;
	this.pointValueHit = 50;
	this.impactWait = 20;
	
	//for hitstop wait effect.
	this.damageHold = 0;
	this.startWait = 0;
	this.waitTime = 0;
	this.waiting = false;

	this.sprite = new Sprite(scene, "redBall.png", 80, 80);
	this.sprite.setBoundAction(CONTINUE);
	this.sprite.setPosition(positionX,positionY); //put player in middle of screen
    this.sprite.setMoveAngle(180);
	this.sprite.setSpeed(0);
	if(this.aggro == true){
		this.sprite.setSpeed(this.speed);
	}
	
	this.update = function(){
		if(this.waiting == false){	
			if(this.knockedBack == true){
				this.performKnockBack();
				this.sprite.setSpeed(this.speed + this.speedModifier);
			}
			if(this.invincible == true){
				this.invincibility(false); //count down invincibility. bool is whether to start the clock or not.
			}
			this.sprite.update();
			if(this.hitPoints <= 0){
				score += this.pointValueDead;
				this.dead = true;
			}
			scene.sSetText(this.hitPoints, this.sprite.x - scene.camera.x, this.sprite.y - scene.camera.y, DEFAULT);
		}
		else{
			this.sprite.setSpeed(0);
			this.sprite.update();
			if(timer.getCurrentTime() - this.startWait >= this.waitTime){
				this.waiting = false;
				this.damageBy(this.damageHold, false);
				//console.log("done waiting.");
			}
		}
	}
	
	this.invincibility = function(set){
		if(set == true){
			this.invincible = true;
			iFrames = 30;
		}
		iFrames--;
		if(iFrames <= 0){
			this.invincible = false;
		}
	}
	
	//Wait, then damage after waiting
	this.setWait = function(time, damage){
		this.damageHold = damage;
		this.waiting = true;
		this.waitTime = time;
		this.startWait = timer.getCurrentTime();
		//console.log("waiting...");
	}
	
	//Amount of damage to do, and whether or not to perform wait effect for hitstop.
	this.damageBy = function(amount, waitBool){
		if(this.invincible == false){	
			if(waitBool == true){
				this.setWait(100, amount);
			}
			this.hitPoints -= amount;
			if(this.aggro == false){		
				if(amount >= this.damageAggroThreshold){
					this.setAggro(true)
				}
			}
		
			this.invincibility(true);
		
			score += this.pointValueHit;
		
			this.knockBack(20);
		}
	}
	
	this.knockBack = function(force){
		this.knockedBack = true;
		this.knockedBackXenith = false;
		this.knockBackForce = force;
	}
	
	this.performKnockBack = function(){
		if(this.knockedBack == true && this.knockedBackXenith == false){
			this.speedModifier += this.knockBackForce / 2;	
			if(this.speedModifier >= this.knockBackForce){
					this.knockedBackXenith = true;
				}
			}
		else if(this.knockedBack == true){
			this.speedModifier--;
			if(this.speedModifier <= 0){
				this.knockedBack = false;
				this.knockBackForce = 0;
				this.sprite.setSpeed(this.speed);
				}
			}
		}
	
	this.setAggro = function(bool){
		this.aggro = bool;
		if(this.aggro == false){
			this.sprite.setSpeed(0);
		}
		else{
			//waiting = true;
			this.sprite.setSpeed(this.speed);
		}
	}
	
	this.chase = function(player){
		if(this.waiting == false){
			this.sprite.setAngle(this.sprite.angleTo(player.sprite));
		}
	}
}	

function Pickup (){
	this.sprite = new Sprite(scene, "challice.png", 30, 30);
	this.sprite.setBoundAction(CONTINUE);
	this.sprite.setPosition(500,10);
	this.sprite.setMoveAngle(0);
	this.sprite.setSpeed(0);
	
	this.dead = false;
	this.pointValue = 200;
	
	this.update = function(){
		this.sprite.update();
	}
}

function FreeCamera(){
	this.x = 0;
	this.y = 0;
	
	this.update = function(){
		
	}
}

function HUD(player, scene){
	this.scene = scene;
	this.player = player;
	
	this.update = function(){
		//scene.sSetText(this.player.hitPoints, DEFAULT, 10, 30);
		scene.sSetText("SCORE: " + score, 100, 30, SCORE);
	}
}

function Waiter(){
	this.startWait = 0;
	this.waitTime = 0;
	this.waiting = false;
	
	this.setWait = function(time){
		this.waiting = true;
		this.waitTime = time;
		this.startWait = timer.getCurrentTime();
		console.log("waiting...");
	}
	
	this.update = function(){
		if(timer.getCurrentTime() - this.startWait >= this.waitTime){
			this.waiting = false;
			console.log("done waiting.");
		}
	}
}
  
function init(){
	gameOver = false;
	score = 0;
	console.log("Creating new game...");
	if(firstRun == true){
		scene = new Scene();
		timer = new Timer();
	}
	
	timer.reset();
	scene.clearText();
	
	waiter = new Waiter();
	player = new Player();
	
	world = new World(20, 20);
	world.initialize();
	
	bullet = [];
	enemy = [];
	enemy.push(new Enemy(400, 500));
	enemy.push(new Enemy(100, 200));
	enemy[1].setAggro(false);

	pickup = new Pickup();
	
	orb = new Orb(player.sprite);
	
	//Free cam for debugging. Send player as paramater normally.
	//camParent = new FreeCamera();
	//camera = new FreeCamera(scene, camParent);

	camera = new Camera(scene, player.sprite, scene.width/2, scene.height/2);
	hud = new HUD(player, scene);
	
	aiController = new AiController(player);
	
	if(firstRun == true){
		scene.start();
	}

} // end init

function reset(){
	firstRun = false;
	init();
}

function setGameOver(condition){
	gameOver = true;
	waiter.setWait(2000); // wait for 2 seconds.
	if(condition == WIN){
		scene.sSetText("You Win!", 100, 300, GAMEOVER);
	}
	else if(condition == LOSE){
		scene.sSetText("You Lose", 100, 300, GAMEOVER);
	}
	
	scene.sSetText("Press Fire To Restart", 100, 400, GAMEOVER);
	
	if(score > highScore){
		highScore = score;
		scene.sSetText("New High Score!", 100, 500, GAMEOVER);
	}
	else{
		scene.sSetText("High Score: " + highScore, 100, 500, GAMEOVER);
	}
}

function fire(){
	if(gameOver == false){
		if(currentBullets < maxBullets){		
			bullet.push(new Bullet(player.sprite.x, player.sprite.y, player.sprite.getMoveAngle(), bulletSpeed, true));
			//console.log(bullet); //debug
			currentBullets++;
		}
	}
	else{
		reset();
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
		player.sprite.turnBy(rotateSpeed * -1);
	}
	if(keysDown[K_RIGHT] == true){
		player.sprite.turnBy(rotateSpeed);
	}
	
	/*
	//Move FreeCam with WASD
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
	*/
	
	this.oldPlayerX = player.sprite.x;
	this.oldPlayerY = player.sprite.y;
	
		//Move player with WASD
	if(keysDown[K_W] == true){
		player.sprite.y = player.sprite.y - playerSpeed;
	}
	if(keysDown[K_S] == true){
		player.sprite.y = player.sprite.y + playerSpeed;
	}
	if(keysDown[K_A] == true){
		player.sprite.x = player.sprite.x - playerSpeed;
	}
	if(keysDown[K_D] == true){
		player.sprite.x = player.sprite.x + playerSpeed;
	}
	
	if(player.sprite.x <= 0){
		player.sprite.x = this.oldPlayerX;
	}
	if(player.sprite.y <= 0){
		player.sprite.y = this.oldPlayerY;
	}
}

	
function update(){
	if(waiter.waiting == false){
		input();
		aiController.update();
		scene.clear();
		if(gameOver == false){	
			camera.update();
			
			//World tiles go here
			world.update();
			
			player.update();
			for(i = 0; i < enemy.length; i++){
				if(enemy[i].dead == true){
					enemy.splice(i, 1);
					if(enemy.length == 0){
						setGameOver(WIN);
					}
				}
				else{
					enemy[i].update();
					for(j = 0; j < enemy.length; j++){
						if(enemy[j].waiting == false){	 //if enemy is in hitstop effect, it can't damage the player.
							if(player.sprite.collidesWith(enemy[j].sprite) == true){
								player.damageBy(1);
							}
						}
					}
				}
			}
			orb.update();
			for(i = 0; i < bullet.length; i++){
				//remove from array if it has "died".
				if(bullet[i].dead == true){
					bullet.splice(i, 1);
					currentBullets--;
				}
				else{
					bullet[i].update();
					for(j = 0; j < enemy.length; j++){
						console.log(i);
						if(bullet[i].sprite.collidesWith(enemy[j].sprite) == true){
							bullet[i].dead = true;
							enemy[j].damageBy(bullet[i].damage, true);
						}
					}
				}
			}
			if(pickup.dead == false){
				pickup.update()
				if(player.sprite.collidesWith(pickup.sprite)){
					score += pickup.pointValue;
					pickup.dead = true;
				}
			}

			if(player.hitPoints <= 0){
				setGameOver(LOSE);
			}
		}
		if(waiter.waiting == false){
			hud.update();
			scene.drawText();
		}
	}
		
	else{
		waiter.update();
	}
} // end update

WIN = 0; LOSE = 1