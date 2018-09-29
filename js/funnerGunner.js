//
// funnerGunner.js
// Alexander Rutan
//

//A game about running around with an orb smashing red balls.
//Red balls will eventually drop the key to move to the next level.
//Try to get a high score!

//Global variables
var firstRun = true;
var gameOver = false;
var winner = false;
var gotKey = false;
var keySpawned = false;

var timer;
var waiter;
var game;
var scene;
var player;
var exit;

var screenFilters = [];
var sounds = [];

var treasure = [];

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

//Tells enemies what to do.
//Takes the target so we can use that information
//when telling AI what to do.
function AiController(player){
	this.target = player;
	
	//If the enemies are angry, chase the player.
	this.update = function(){
		for(i = 0; i < enemy.length; i++){
			if(enemy[i].aggro == true){
				enemy[i].chase(this.target);
			}
		}
	}
}

//Keep track of levels only at the moment.
function GameDirector(){
	this.levelCount = 0;
	
}

//Defines the size of the world and our grid of sprite tiles to represent the background.
//Spawns the player, enemies, treasure, and exit in a different spot every time.
function World(height, width){
	this.tiles = [];
	enemy = [];
	this.yBound = height * 100;
	this.xBound = width * 100;
	this.playerPosX = 0;
	this.playerPosY = 0;
	
	this.initialize = function(){
		
		//Drop the player in a random spot
		player = new Player();
		keepGoing = true;
		while(keepGoing == true){			
			for(i = 0; i <= height - 1; i++){
				for(j = 0; j <= width - 1; j++){
					if(Math.floor((Math.random() * 100) + 1) > 99){	
						this.playerPosX = i*100;
						this.playerPosY = j*100;
						player.sprite.setPosition(this.playerPosX , this.playerPosY);
						keepGoing = false;
					}
				}
			}
		}	
		
		//Spawn the exit in the same way as the player.
		keepGoing = true;
		while(keepGoing == true){			
			for(i = 0; i <= height - 1; i++){
				for(j = 0; j <= width - 1; j++){
					if(Math.floor((Math.random() * 100) + 1) > 99){	
						exit = new Exit(i*100, j*100)
						keepGoing = false;
					}
				}
			}
		}				
		
		//Create the floor grid and spawn the first round of enemies.
		//The enemies that are created here will start off not hostile to the player.
		//That means that each level feels different because different amounts of enemies will rush the player each time.
		//Sometimes they all rush, sometimes none of them do.
		for(i = 0; i <= height; i++){
			for(j = 0; j <= width; j++){
				this.tiles.push(new Tile(scene, "dirt2.png", i*100, j*100));
				//spawn enemies.
				if(enemy.length <= 10 + game.levelCount){
					if(Math.floor((Math.random() * 100) + 1) > 98 && i*100 != this.playerPosX && j*100 != this.playerPosY){
						//console.log("Enemies: " + enemy.length);
						//console.log("Location:" + i*100 +", " + j*100);
						enemy.push(new Enemy(i*100, j*100));
						enemy[enemy.length - 1].setAggro(false);
					}
				}
			}
		}
		//Any enemies that aren't spawned in the first round are spawned here, and they are
		//hostile to the player by default.
		while(enemy.length <= 10 + game.levelCount){
			for(i = 0; i <= height; i++){
				for(j = 0; j <= width; j++){
					if(enemy.length <= 10 + game.levelCount){
						if(Math.floor((Math.random() * 100) + 1) > 98){	
							//console.log("Enemies: " + enemy.length);
							//console.log("Location:" + i*100 +", " + j*100);
							enemy.push(new Enemy(i*100, j*100));
						}	
					}
				}
			}
		}
		
		//Spawn lots of treasure. More opportunity to gain points the more levels you play.
		while(treasure.length <= 10 * game.levelCount){
			for(i = 0; i <= height; i++){
				for(j = 0; j <= width; j++){
					if(treasure.length <= 10 * game.levelCount){
						if(Math.floor((Math.random() * 100) + 1) > 98){	
							treasure.push(new Treasure(i*100, j*100, DEFAULT));
						}	
					}
				}
			}
		}
	}
	
	//Called in the main update to show the floor tiles each frame.
	this.update = function(){
		for(i = 0; i < this.tiles.length; i++){
			this.tiles[i].update();
		}
	}
}

//Unused. Replaced with orb, which is more fun.
//Originally used to test collision and other game features
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

//Heart and soul of the game.
//The orb harms enemies and knocks them back.
//Orbits the player.
function Orb(parent){
	//Uses the only animation in the game at the moment.
	this.parent = parent;
	this.sprite = new Sprite(scene,"orb.png",20,20)
	this.sprite.loadAnimation(204,46,34,34);
	this.sprite.generateAnimationCycles();
	this.sprite.setAnimationSpeed(500);
	this.sprite.setBoundAction(CONTINUE);
	//this.sprite.setMoveAngle(angle);
	//this.sprite.setSpeed(velocity);		
	
	this.x = 0;
	this.y = 0;
	this.radius = 100;
	this.damage = 1;
	this.dead = false;
	this.sprite.setPosition(this.parent.x + this.radius, this.parent.y);
	
	//for hitstop wait effect.
	this.damageHold = 0;
	this.startWait = 0;
	this.waitTime = 0;
	this.waiting = false;
	
	//Wait for hitstop effect
	this.setWait = function(time){
		this.waiting = true;
		this.waitTime = time;
		this.startWait = timer.getCurrentTime();
		//console.log("waiting...");
	}
	
	this.update = function(){
		this.orbit();
		this.sprite.setPosition(this.x, this.y);
		this.sprite.update();
		if(this.sprite.visible == false){
			this.dead = true;
		}
	}
	
	//If the orbit is not waiting, orbit the player.
	this.orbit = function(){
		if(this.waiting == false){	
			this.sprite.turnBy(2);
		}
		else{
			if(timer.getCurrentTime() - this.startWait >= this.waitTime){
				this.waiting = false;
				//console.log("done waiting.");
			}
		}
		//Follow the parent, always the player but theoretically any other sprite can have their
		//own orb. Take the parent position and do some maths.
		this.x = this.parent.x + (this.radius * Math.cos(this.sprite.moveAngle));
		this.y = this.parent.y + (this.radius * Math.sin(this.sprite.moveAngle));
	}
}

//Player and his sprite.
//Can be damaged and can either have the key or not have the key.
//Hitpoints set to 1 for that classic arcade punishment.
function Player (){
	this.x = scene.width/2;
	this.y = scene.height/2;
	
	this.sprite = new Sprite(scene, "warlock.png", 50, 50);
	this.sprite.setBoundAction(CONTINUE);
	this.sprite.setPosition(1,1); //put player in middle of screen
	this.sprite.setMoveAngle(180);
	this.sprite.setSpeed(0);
	
	this.hitPoints = 1;
	
	this.hasKey = false;
	
	this.update = function(){
		this.sprite.update();
	}
	
	this.damageBy = function(amount){
		this.hitPoints -= amount;		
	}
}

//Enemy class can chase, run away, be set to hostile or passive, spawn other enemies, 
//and be damaged. 
function Enemy (positionX, positionY){
	this.hitPoints = 5;
	this.damageAggroThreshold = 1;
	//If speed is positive, it runs from the player
	//If negative, it moves toward the player.
	this.speed = -1;
	this.speedModifier = 0;
	this.dead = false;
	this.aggro = true;
	this.invincible = false;
	this.knockedBack = false; this.knockedBackXenith = false;

	this.knockBackForce = 0;
	this.pointValueDead = 200;
	this.pointValueHit = 50;
	this.impactWait = 100; //default 100
	
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
	
	//Enemies will not do anything if not aggro'd
	if(this.aggro == true){
		this.sprite.setSpeed(this.speed);
	}
	
	//lots of stuff
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
				//Die, when it is set to dead, our main update loop will remove it from the enemies array
				//So that it no longer is drawn or updated.
				
				//Increment user's score.
				score += this.pointValueDead;
				
				//For everyone one that falls, two must take its place!
				if(enemy.length < 100){
					this.spawnEnemy();
					this.spawnEnemy();
				}
				
				//If we haven't spawned a key yet, and spawning a key on this enemy wouldn't be a place where the 
				//player can't reach, then chance to drop this level's key.
				if(keySpawned == false && this.sprite.x < world.xBound && this.sprite.y < world.yBound){	
					if(Math.floor((Math.random() * 100) + 1) > 75){					
						treasure.push(new Treasure(this.sprite.x, this.sprite.y, KEY));
						keySpawned = true;
					}			
				}
				this.dead = true;
			}
			
			//Change hitpoint value painted on them.
			scene.sSetText(this.hitPoints, this.sprite.x - scene.camera.x, this.sprite.y - scene.camera.y, DEFAULT);
		}
		else{
			this.sprite.setSpeed(0);
			this.sprite.update();
			if(timer.getCurrentTime() - this.startWait >= this.waitTime){
				this.sprite.setImage("redBall.png");
				this.waiting = false;
				this.damageBy(this.damageHold, false);
				//console.log("done waiting.");
			}
		}
		if(this.sprite.visible == false){
			this.dead = true;
			console.log("Dead");
		}
	}
	
	//Spawn new aggro'd enemies off in the distance. 
	//Instead of using a timer, this puts pressure on the player the longer they play.
	this.spawnEnemy = function(){
		rightSpawn = this.sprite.scene.cWidth + 400;
		leftSpawn = -400; 
		topSpawn = -300;
		bottomSpawn = this.sprite.scene.cHeight + 300;
		keepGoing = true;
		while(keepGoing == true){
			for(i = 0; i < 4; i++){
				if(Math.floor((Math.random() * 100) + 1) > 99){	
					if(i == 0){
						enemy.push(new Enemy(rightSpawn, 300));
					}
					else if(i == 1){
						enemy.push(new Enemy(leftSpawn, 300));
					}
					else if(i == 2){
						enemy.push(new Enemy(400, topSpawn));
					}
					else if(i == 3){
						enemy.push(new Enemy(400, bottomSpawn));
					}
					keepGoing = false;
				}
			}
		}
	}
	
	//Since the enemy is held by the hitstop effect (for great feedback), make it so by
	//continuing to be in contact with the orb they do not take damage.
	//Invicible for 30 frames every time they are hit.
	this.invincibility = function(set){
		if(set == true){
			this.invincible = true;
			iFrames = 30;
			//console.log("invincible");
		}
		iFrames--;
		if(iFrames <= 0){
			this.invincible = false;
		}
	}
	
	//Wait, then damage after waiting
	//This is the heart of the great feedback every time the player damages the ball.
	//Change the sprite and set the current time, so we know when time is up in update().
	this.setWait = function(time, damage){
		this.sprite.setImage("redBallyellow.png");
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
				this.setWait(this.impactWait, amount);
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
			
			//RUN AWAY!!!
			if(this.hitPoints == 1){
				this.speed = 1;
				this.sprite.setBoundAction(DIE);
			}
		}
	}
	
	//knock the enemy back away from where it is currently facing (always the player).
	this.knockBack = function(force){
		this.knockedBack = true;
		this.knockedBackXenith = false;
		this.knockBackForce = force;
	}
	
	//Knock back, when it has traveled far enough back, stop knocking.
	this.performKnockBack = function(){
		if(this.knockedBack == true && this.knockedBackXenith == false){
			this.speedModifier += this.knockBackForce / 2;	
			if(this.speedModifier >= this.knockBackForce){
					this.knockedBackXenith = true;
				}
			}
		//slow down after we've been knocked back a certain amount.
		//Gives the impression of taking a big hit.
		else if(this.knockedBack == true){
			this.speedModifier--;
			if(this.speedModifier <= 0){
				this.knockedBack = false;
				this.knockBackForce = 0;
				this.sprite.setSpeed(this.speed);
				}
			}
		}
	
	//whether or not to chase the player.
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
	
	//Called by the AI controller to tell the enemy what to do.
	//Is sent the player so we can get its properties. In this case, angle.
	//Ensures we are always facing the player.
	this.chase = function(player){
		if(this.waiting == false){
			this.sprite.setAngle(this.sprite.angleTo(player.sprite));
		}
	}
}	

//Key is a type of treasure, when it is hit, we can go through the exit.
//Challices are just for points. When collected, they give a screen filter feedback.
//Key gives a blue one rather than a gold one.
function Treasure (x, y, type){
	if(type == KEY){
		this.sprite = new Sprite(scene, "key.png", 35, 35);
		this.isKey = true;
		//scene.sSetText("KEY FOUND", 300, 200, ALERT);
	}
	else if(type == DEFAULT){
		this.sprite = new Sprite(scene, "challice.png", 35, 35);
		this.isKey = false;
	}

	this.sprite.setBoundAction(CONTINUE);
	this.sprite.setPosition(x,y);
	this.sprite.setMoveAngle(0);
	this.sprite.setSpeed(0);
	
	this.dead = false;
	this.pointValue = 200;
	
	this.update = function(){
		this.sprite.update();
	}
}

//Ends the level and rewards points to the user if they have the key.
//If not, tell them they need to find the key.
function Exit(x, y){
	this.sprite = new Sprite(scene, "door.png", 50, 50);
	this.sprite.setBoundAction(CONTINUE);
	this.sprite.setPosition(x,y);
	this.sprite.setMoveAngle(0);
	this.sprite.setSpeed(0);
	
	this.update = function(){
		this.sprite.update();
	}
	
	this.activate = function(){
		if(gotKey == true){
			score += 1000 * game.levelCount;
			setGameOver(false);
		}
		else{
			console.log("Find key to exit.");
			scene.sSetText("NEED KEY", 350, 200, ALERT);
		}
	}
}

//Used for debugging early. Can move it around the environment freely rather than
//Having it paired to a parent.
function FreeCamera(){
	this.x = 0;
	this.y = 0;
	
	this.update = function(){
		
	}
}

//Calls my setText method added to simplegame that displays the current level and player's score.
function HUD(player, scene){
	this.scene = scene;
	this.player = player;
	
	this.update = function(){
		scene.sSetText("Level: " + game.levelCount, 700, 30, LEVEL);
		scene.sSetText("SCORE: " + score, 100, 30, SCORE);
	}
}

//Play a sound using simplegame
function playSound(sound){
	sounds[sound].play();
}

//Used to flash the screen a certain color when an event happens.
//Currently only used when picking up treasure or the key.
function ScreenFilter(type, scene){
	if(type == TREASURE){
		this.sprite = new Sprite(scene, "treasureFilter.png", 800 , 600);
	}
	else if(type == KEY){
		this.sprite = new Sprite(scene, "keyFilter.png", 800 , 600);
	}
	this.sprite.setBoundAction(CONTINUE);
	this.sprite.setPosition(400,300);
	this.sprite.setMoveAngle(0);
	this.sprite.setSpeed(0);
	this.sprite.noCam = true;
	
	this.startWait = 0;
	this.waitTime = 50;
	this.waiting = false;
	
	//Only flash for a moment. Defined by waittime.
	//When we are not flashing, do not update.
	this.update = function(){
		if(this.waiting == true){
			if(timer.getCurrentTime() - this.startWait >= this.waitTime){
				this.waiting = false;
			}
			this.sprite.update();
		}
		//this.sprite.update();
	}
	
	//Start the flash with the current time.
	this.activate = function(){
		this.waiting = true;
		this.startWait = timer.getCurrentTime();
	}
}

//Conceived as a way to pause the game. 
//This "waiting" methodology was applied to many other game elements,
//But they all have their own special waiting function.
//This just makes the game freeze when the sound effects at the end of a session play.
//Originally added because playtesters were smashing the space bar to shoot as they died
//and skipping the end game score screen on accident.
function Waiter(){
	this.startWait = 0;
	this.waitTime = 0;
	this.waiting = false;
	
	this.setWait = function(time){
		this.waiting = true;
		this.waitTime = time;
		this.startWait = timer.getCurrentTime();
		//console.log("waiting...");
	}
	
	this.update = function(){
		if(timer.getCurrentTime() - this.startWait >= this.waitTime){
			this.waiting = false;
			//console.log("done waiting.");
		}
	}
}
  
 //Initialize the game. Set up things on first run, carry them over if not the first run.
function init(){
	gameOver = false;
	keySpawned = false;
	gotKey = false;
	width = 20;
	height = 20;
	console.log("Creating new game...");
	if(firstRun == true){
		timer = new Timer();
		scene = new Scene(timer);
		game = new GameDirector();
			//Filters
		screenFilters.push(new ScreenFilter(TREASURE, scene));
		screenFilters.push(new ScreenFilter(KEY, scene));
		
		//Set up audio.
		sounds.push(new Sound("audio/treasure.mp3")); //slot 0;
		sounds.push(new Sound("audio/hit.mp3")); //slot 1
		sounds.push(new Sound("audio/win.mp3")); //slot 2
		sounds.push(new Sound("audio/lose.mp3")); //slot 3
	}
	
	scene.setBounds(width, height);	
	
	if(winner == false){
		score = 0;
		game.levelCount = 0;
	}
	
	game.levelCount++;
	timer.reset();
	scene.clearText();
	
	waiter = new Waiter();
	treasure = [];
	world = new World(width, height);
	world.initialize();
	
	bullet = [];
	
	//pickup = new Pickup();
	
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

	//testSound = new Sound("")
} // end init

//Call the init method but it will not reload the canvas or anything, just reset game elements.
function reset(){
	firstRun = false;
	init();
}

//Play a sound and make the game wait. Tally points, if it is a new high score, let them know.
//If not, tell them the high score.
function setGameOver(condition){
	gameOver = true;
	if(condition == WIN)
	{
		playSound(CLEARED);
	}
	else{
		playSound(LOSE);
	}
	waiter.setWait(2000); // wait for 2 seconds.
	if(condition == WIN){
		winner = true;
		scene.sSetText("You Win!", 100, 300, GAMEOVER);
		scene.sSetText("Press Space Bar To Continue", 100, 400, GAMEOVER);		
	}
	else if(condition == LOSE){
		winner = false;
		scene.sSetText("Game Over", 100, 300, GAMEOVER);		
		scene.sSetText("Press Space Bar To Restart", 100, 400, GAMEOVER);	
		if(score > highScore){
			highScore = score;
			scene.sSetText("New High Score!", 100, 500, GAMEOVER);
		}
		else{
			scene.sSetText("High Score: " + highScore, 100, 500, GAMEOVER);
		}
	}
}

//Was used for firing bullets earlier in development.
//Still used during the intermission screen.
function fire(){
	if(gameOver == false){
		/*
		if(currentBullets < maxBullets){		
			bullet.push(new Bullet(player.sprite.x, player.sprite.y, player.sprite.getMoveAngle(), bulletSpeed, true));
			//console.log(bullet); //debug
			currentBullets++;
		}
		*/
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
	
	/*
	//Left and Right keys for rotating
	if(keysDown[K_LEFT] == true){
		player.sprite.turnBy(rotateSpeed * -1);
	}
	if(keysDown[K_RIGHT] == true){
		player.sprite.turnBy(rotateSpeed);
	}
	*/
	
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
	
	
	//Save player's current valid coords each frame.
	//If the player's new coords are not in bounds, set them back.
	//this is all done without drawing first so it doesn't look jittery.
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
	
	if(player.sprite.x <= 0 || player.sprite.x >= world.xBound){
		player.sprite.x = this.oldPlayerX;
	}
	if(player.sprite.y <= 0 || player.sprite.y >= world.yBound){
		player.sprite.y = this.oldPlayerY;
	}
}

//Called every frame to update everything in the game.
function update(){
	//If the game is not paused/waiting for dramatic effect...
	if(waiter.waiting == false){
		//Get input first.
		input();
		//Get what I consider to be the AI's input.
		aiController.update();
		//Clear the screen
		scene.clear();
		if(gameOver == false){	
			//update camera position relative to player.
			camera.update();
			
			//World tiles go here
			world.update();
			
			//Draw the door, exit if they have the key.
			exit.update();
			if(player.sprite.collidesWith(exit.sprite) == true){
					exit.activate();
				}
			
			//If we've managed to kill all the enemies, end the game.
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
						if(enemy[j].invincible == false){	 //if enemy is in hitstop effect, it can't damage the player.
							if(player.sprite.collidesWith(enemy[j].sprite) == true){
								player.damageBy(1);
							}
						}
					}
				}
			}
			//Update the orb, play the hit sound if it hits something.
			//Set it's wait for our nice hitstop feedback.
			//Perform the camera shake for even better feedback!
			orb.update();
				for(i = 0; i < enemy.length; i++){
					if(orb.waiting == false){
						if(orb.sprite.collidesWith(enemy[i].sprite) == true){
							playSound(HIT);
							enemy[i].damageBy(orb.damage, true);
							orb.setWait(100)
							scene.camera.shake(timer.getCurrentTime());
						}
					}
				}
			//Update array of bullets.
			for(i = 0; i < bullet.length; i++){
				//remove from array if it has "died".
				if(bullet[i].dead == true){
					bullet.splice(i, 1);
					currentBullets--;
				}
				else{
					bullet[i].update();
					for(j = 0; j < enemy.length; j++){
						if(bullet[i].sprite.collidesWith(enemy[j].sprite) == true){
							bullet[i].dead = true;
							enemy[j].damageBy(bullet[i].damage, true);
						}
					}
				}
			}
			//Pick up treasure, if the treasure is the key, we have the key.
			for(i = 0; i < treasure.length; i++)
			{
				if(treasure[i].dead == false){
					treasure[i].update()
					if(player.sprite.collidesWith(treasure[i].sprite)){
						playSound(TREASURE);
						if(treasure[i].isKey == true){
							screenFilters[KEY].activate();
							gotKey = true;
						}
						else{
							screenFilters[TREASURE].activate();
							score += treasure[i].pointValue;
						}
						treasure[i].dead = true;
						treasure.splice(i, 1);
					}
				}
			}
			
			//If the screen filters are active, flash the screen a color.
			for(i = 0; i < screenFilters.length; i++){
				screenFilters[i].update();
			}
			
			//End the game if the player died.
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

//Game over states
WIN = 0; LOSE = 1

//Fullscreen filters
TREASURE = 0;

//Treasure type
DEFAULT = 0; KEY = 1;

//Sounds
TREASURE = 0; HIT = 1; CLEARED = 2; LOSE = 3;