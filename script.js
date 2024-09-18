'use strict';
import confetti from 'https://cdn.skypack.dev/canvas-confetti';

//TABLE OF CONTENTS (you may search for each section exactly how it is written below)-----------------------------------------
/*
SECTION 1: GLOBAL VARIABLES
SECTION 2: QUESTION CLASS AND SUBCLASSES
  2A: QUESTION CLASS
  2B: POKEMON PICTURE QUESTION SUBCLASS
  2C: POKEMON TYPE QUESTION SUBCLASS
  2D: POKEMON ABILITY QUESTION SUBCLASS
  2E: POKEMON STATS SUBCLASS
  2F: POKEMON HEIGHT AND WEIGHT SUBCLASS
SECTION 3: ASYNC FUNCTIONS (FETCHING POKEAPI DATA) AND GAME PREPARATION FUNCTIONS
  3A: ASYNC FUNCTIONS WITH FETCH(), JSON(), and PROMISE.ALLSETTLED()
  3B: RANDOM NUMBER FUNCTIONS, ARRAY SHUFFLE FUNCTIONS, SETTING UP THE POKEMON IDS, SETTING UP POKEMON QUESTIONS ARRAY
  3C: PREPARING THE GAME FUNCTION
SECTION 4: DOM MANIPULATION AND EVENT LISTENERS
  4A: ALL QUERY SELECTORS FOR DOM MANIPULATION
  4B: HELPER FUNCTIONS THAT RENDER ELEMENTS ONTO THE SCREEN
    Includes: insertButton, startCountdownTimer, loseFromTimeOut, updateAndRenderStreak, renderQuestionAndAnswers, resetGame, renderWinScreen, fadeOrBrightenBackGrnd, deactivateAllButtons, reactivateAllButtons
  4C: ALL EVENT LISTENERS
SECTION 5: INTRO SCREEN CODE 
*/ //--------------------------------------------------------------------------------------------------------------------------

//----SECTION 1: GLOBAL VARIABLES----------------------------------------------------
let globalPokeData = []; //will contain data for up to 30 different pokemon
let pokemonNumIDArr = []; //will contain the IDs of the pokemon that will be used to fetch data from pokeAPI
let pokemonQuestionsArr = []; //will contain questions to be used for the game
let currentQuestionNum = 0; //to keep track of what question the player is on
let currentStreak = 0; //to keep track of how many questions in a row a player has gotten correct in a row currently
let streakRecord = 0; //best record of the player
let continuingStreak = false; //to describe the state of whether a play has an ongoing streak
let userPokemonRange = 'oldschool'; //user's preference for the pokemon range
let questionTypePreference = 'all'; //user's preference for the type of questions desired
let currentTimer = null; //will store the setInterval ID so that the timer can be turned off during certain events of the game
let playerTag = ''; //global variable to store the trainer tag
let playerName = ''; //global variable to store the player's inputted name

//used to organize the different "themes" that I want to implement in the footer section
//prettier-ignore
const backgroundStyles = [
  {color: 'red', lighter: '#fa2626', darker: '#2f000c', highlight: '#FF9999' },
  {color: 'blue', lighter: '#007bff', darker: '#014078', highlight: '#ADD8E6',},
  {color: 'yellow', lighter: '#ffeb3b',darker: '#c5961f', highlight: '#FFFF99',},
  {color: 'green', lighter: '#5ac65e', darker: '#05671c', highlight: '#90EE90',},
  {color: 'purple', lighter: '#b22bca', darker: '#6a0080', highlight: '#C3B1E1',},
  {color: 'pink', lighter: '#ff83ac', darker: '#d1115e', highlight: '#FFB6C1',},
  {color: 'brown', lighter: '#dd6119', darker: '#3f2f1d', highlight: '#A98274',},
  {color: 'grey', lighter: '#bdc3c7', darker: '#2c3e50', highlight: '#D3D3D3',},
];

const introScreenFormHTML = document.querySelector(
  '.intro-screen-form-HTML'
).innerHTML;
//grabbed the inner HTML from some elements in the HTML page so that it can be used for the pop-up boxes when clicking on the settings or instructions button on the aside
const instructionsHTML = document.querySelector('.pop-up-box').innerHTML;
const settingsHTML = document.querySelector('.settings-HTML').innerHTML;
//removed the nodes after its HTML was stored
document.querySelector('.settings-HTML').remove();
document.querySelector('.intro-screen-form-HTML').remove();

//---SECTION 2: QUESTION CLASS AND SUBCLASSES -----------------------------------------------------

//---SECTION 2A: QUESTION CLASS
//question class used to model all the different types of questions
class Question {
  constructor(pokeData) {
    this.pokeData = pokeData; //pokemon data from the pokeAPI be used to formulate each question and its answers
    this.answerIndex = shuffleArray([1, 2, 3, 4]); //indices will be used to determine where in the DOM answer choices will be placed
  }

  //other data from the globalPokeData will be used to devise a question's incorrect choices. Thus, each question class will have the ability to utilize data from any pokemon in the globalPokeData array in order to create wrong answers for the question
  makeThreeRandomIndicesArray() {
    const randomIndicesArr = []; //to store 3 random indices
    for (let i = 0; i < 3; i++) {
      let num = createRandomNumber(0, 28);
      //ensures that there won't be duplicates of the correct answer in the wrong answer index array
      while (randomIndicesArr.some(index => num === index)) {
        num = createRandomNumber(0, 28);
      }
      randomIndicesArr.push(num);
    }

    return randomIndicesArr;
  }

  //creates a copy of the globalPokeData array WITHOUT the correct answer
  createWrongAnswerPokeDataArray(pokeData) {
    return [...globalPokeData].filter(data => data.name !== pokeData.name);
  }

  //in order to capitalize strings appropriately
  capitalizeString(string) {
    return string[0].toUpperCase() + string.slice(1);
  }

  createIncorrectAnswerArray(pokeData, retrieveFunction, ansIndex) {
    let incorrectAnswers = [];
    //produces an array of pokemon data to be used to derive wrong answers from
    //prettier-ignore
    const wrongAnswerPokeDataArr = this.createWrongAnswerPokeDataArray(pokeData);

    //creates an array of three random indices which will serve as the indices from the wrongAnswerPokeData array from which the incorrect answers will be created
    const randomIndices = this.makeThreeRandomIndicesArray();
    randomIndices.forEach((randomIndex, i) => {
      //creation of the incorrect answer object
      const incorrectAnswer = {
        isCorrect: false, //will indicate that this answer is NOT the correct answer
        answerNumber: ansIndex[i + 1], //sets a number 1-4 for each answer object (to determine where it will be placed in the DOM when rendered)
      };

      //based on the function argument, will generate a wrong answer based off a random pokemon in the wrong pokeData array. Then it sets it as a property in the incorrect answer object
      //prettier-ignore
      incorrectAnswer.answer = retrieveFunction(wrongAnswerPokeDataArr[randomIndex]);
      incorrectAnswers.push(incorrectAnswer); //push the incorrect object in an incorrect object array
    });

    //returns an array of three incorrect answer objects
    return incorrectAnswers;
  }
}

//2B POKEMON PICTURE QUESTION SUBCLASS---------------------------------
class pictureQuestion extends Question {
  constructor(pokeData) {
    super(pokeData);
    this.answers = pokeData;
    this.questionPrompt = pokeData;
  }

  //retrives the name of the Pokemon
  retrievePokemonName(pokeData) {
    return this.capitalizeString(pokeData.name);
  }

  //retrives the answer for pictureQuestion
  get answers() {
    return this._answers;
  }

  //sets the answers for pictureQuestion based on the pokeData
  set answers(pokeData) {
    //creation of the correct answer object. note, each answer object will have the following properties: isCorrect (denoting if an answer is correct), the actual answer, and the answerNumber (this will determine where the answer will be placed in the DOM)
    const correctAnswer = {
      isCorrect: true,
      answer: this.capitalizeString(pokeData.name),
      answerNumber: this.answerIndex[0],
    };

    //expect an array of three answer objects that will serve as the question's incorrect answers
    const incorrectAnswers = this.createIncorrectAnswerArray(
      pokeData,
      this.retrievePokemonName.bind(this),
      [...this.answerIndex]
    );
    this._answers = [correctAnswer, ...incorrectAnswers];
  }

  //retrieves the questionPrompt
  get questionPrompt() {
    return this._questionPrompt;
  }

  //sets the questionPrompt based on the pokeData
  set questionPrompt(pokeData) {
    this._questionPrompt =
      'What is the name of the pokemon presented in the image above?';
  }
}

//2C POKEMON TYPE QUESTION SUBCLASS------------------------------------
class typeQuestion extends Question {
  //pokemonTypes contains all types available in the pokemon world. This will be used to generate incorrect response for the typeQuestion class
  //prettier-ignore
  pokemonTypes = ['Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'];

  constructor(pokeData) {
    super(pokeData);
    this.questionPrompt = pokeData;
    this.answers = pokeData;
  }

  //function to be used to ensure no two answer objects will contain the same answer
  correctForDuplicateAnswers(arr) {
    let answerSet = new Set(arr);
    while (answerSet.size < 4) {
      let num = createRandomNumber(0, this.pokemonTypes.length);
      answerSet.add(this.pokemonTypes[num]);
    }
    return [...answerSet];
  }

  //retrieves the questionPrompt
  get questionPrompt() {
    return this._questionPrompt;
  }

  //sets the questionPrompt based on the pokeData for this particular question subclass
  set questionPrompt(pokeData) {
    //prettier-ignore
    this._questionPrompt = `${this.capitalizeString(pokeData.name)} is what type of Pokemon?`;
  }

  get answers() {
    return this._answers;
  }

  //NOTE: I created the wrong answer objects differently for this specific question compared to the other question types. Thus, I did not implement the inherited "create incorrect answer array" from the Question class
  set answers(pokeData) {
    //local variables to be used later on
    const incorrectAnswerStringArr = []; //will hold a string of all incorrect answers
    let randomIndex1;
    let randomIndex2;

    //The for loop runs three times since three incorrect answers must be generated. The code below randomly decides whether the generated answer is of one or two types, and then randomly selects the types from the class' pokemonTypes array
    for (let i = 1; i <= 3; i++) {
      if (Math.random() <= 0.5) {
        //SCENARIO: answer will only of one type
        randomIndex1 = createRandomNumber(0, this.pokemonTypes.length); //create random num from 0-17 (refer to )
        incorrectAnswerStringArr.push(this.pokemonTypes[randomIndex1]); //An incorrect type will be chosen from this class's pokemonTypes array. This incorrect type is then pushed to an incorrectAnswers array
      } else {
        //SCENARIO: answer will be two types
        randomIndex1 = createRandomNumber(0, this.pokemonTypes.length); //create random num from 0-17
        randomIndex2 = createRandomNumber(0, this.pokemonTypes.length); //create random num from 0-17
        //prettier-ignore
        while (randomIndex1 === randomIndex2) 
        {
         //while loop ensures that the dual type won't be the same type (ex. ice ice or fire fire)
          randomIndex2 = createRandomNumber(0, this.pokemonTypes.length);
        }
        incorrectAnswerStringArr.push(
          //push the dual type (ex fairy dark, or fire ground) into the incorrect answer string array
          `${this.pokemonTypes[randomIndex1]} ${this.pokemonTypes[randomIndex2]}`
        );
      }
    }

    //Step 2: derive the correct answer from the pokeData object
    const correctAnswer = pokeData.types.reduce((acc, slot, i) => {
      return (acc +=
        i === 0
          ? `${this.capitalizeString(slot.type.name)}`
          : ` ${this.capitalizeString(slot.type.name)}`);
    }, '');

    //combine the incorrect answers and the correct answer in a single array, then ensure that ALL DUPLICATE ANSWERS ARE TAKEN OUT! the duplicate answers will be replaced with alternate responses and the corrected array will be returned
    const fullResponseStringArr = this.correctForDuplicateAnswers([
      correctAnswer,
      ...incorrectAnswerStringArr,
    ]);

    //after you get the array of answer responses, then map those answer responses into answer objects. and store the resulting array of answer objects into this._answers
    this._answers = fullResponseStringArr.map((response, i) => {
      return {
        isCorrect: response === correctAnswer,
        answer: response,
        answerNumber: this.answerIndex[i],
      };
    });
  }
}

//2D: POKEMON ABILITY QUESTION SUBCLASS----------------------------
class abilitiesQuestion extends Question {
  constructor(pokeData) {
    super(pokeData);
    this.questionPrompt = pokeData;
    this.answers = pokeData;
  }

  //retrieves the Pokemon's abilities from the "pokeData" argument that will be returned as a string that can be used for the answer property of an answer object
  retrievePokemonAbility(pokeData) {
    return pokeData.abilities.reduce((str, entry) => {
      return (str += entry.is_hidden
        ? `(Hidden Ability): ${this.capitalizeString(entry.ability.name)}`
        : `${this.capitalizeString(entry.ability.name)}, `);
    }, '(Normal Abilities): ');
  }

  get answers() {
    return this._answers;
  }

  set answers(pokeData) {
    //grab the correct answer
    const correctAnswer = {
      isCorrect: true,
      answer: this.retrievePokemonAbility(pokeData),
      answerNumber: this.answerIndex[0],
    };

    //grab all incorrect answers
    const incorrectAnswers = this.createIncorrectAnswerArray(
      pokeData,
      this.retrievePokemonAbility.bind(this),
      [...this.answerIndex]
    );

    //return all answers as one array
    this._answers = [correctAnswer, ...incorrectAnswers];
  }

  //retrieves the questionPrompt
  get questionPrompt() {
    return this._questionPrompt;
  }

  //sets the questionPrompt based on the pokeData for this particular question subclass
  set questionPrompt(pokeData) {
    this._questionPrompt = `${this.capitalizeString(
      pokeData.name
    )} can have which of the following sets of abilities?`;
  }
}

//2E: POKEMON STATS SUBCLASS
class statsQuestion extends Question {
  constructor(pokeData) {
    super(pokeData);
    this.questionPrompt = pokeData;
    this.answers = pokeData;
  }

  //like in the above subclass, this retrieves the base stats off the provided pokedata and transforms it into a string to be used in the answer objects
  retrieveBaseStats(pokeData) {
    return pokeData.stats.reduce((str, entry) => {
      return (str += `${this.capitalizeString(entry.stat.name)}: ${
        entry.base_stat
      } `);
    }, '');
  }

  get questionPrompt() {
    return this._questionPrompt;
  }

  //set the question prompt based on question type and pokedata
  set questionPrompt(pokeData) {
    this._questionPrompt = `Which of the following answers displays the correct base stats for the pokemon, ${this.capitalizeString(
      pokeData.name
    )}?`;
  }

  get answers() {
    return this._answers;
  }

  set answers(pokeData) {
    //again, grab the correct answer
    const correctAnswer = {
      isCorrect: true,
      answer: this.retrieveBaseStats(pokeData),
      answerNumber: this.answerIndex[0],
    };
    //again, grab all the incorrect answers
    const incorrectAnswers = this.createIncorrectAnswerArray(
      pokeData,
      this.retrieveBaseStats.bind(this),
      [...this.answerIndex]
    );
    //sets the array of all the answers, both incorrect and correct
    this._answers = [correctAnswer, ...incorrectAnswers];
  }
}

//2F: POKEMON HEIGHT AND WEIGHT SUBCLASS -------------------------------
class heightAndWeightQuestion extends Question {
  constructor(pokeData) {
    super(pokeData);
    this.questionPrompt = pokeData;
    this.answers = pokeData;
  }

  //retrives the height and weight of a pokemon and turns it into a string to be used in the answer objects
  retrieveHeightAndWeight(pokeData) {
    //note: the height provided by the pokeAPI was in decimeters. Thus, i converted it to feet within this retrieve method. For weight, I did the same thing, where I converted the weight value in the pokeAPI to lbs within this retrieve method
    //prettier-ignore
    return `Height: ${(pokeData.height * 0.328084).toFixed(2)} ft, Weight: ${(pokeData.weight * 0.22).toFixed(2)}lbs`;
  }

  get questionPrompt() {
    return this._questionPrompt;
  }

  //sets the questionPrompt based on the pokeData for this particular question subclass
  set questionPrompt(pokeData) {
    this._questionPrompt = `Which of the following answers correctly displays the height and weight of ${this.capitalizeString(
      pokeData.name
    )}?`;
  }

  get answers() {
    return this._answers;
  }

  //again sets the answers array (an array of answer objects)
  set answers(pokeData) {
    const correctAnswer = {
      isCorrect: true,
      answer: this.retrieveHeightAndWeight(pokeData),
      answerNumber: this.answerIndex[0],
    };

    const incorrectAnswers = this.createIncorrectAnswerArray(
      pokeData,
      this.retrieveHeightAndWeight.bind(this),
      [...this.answerIndex]
    );

    this._answers = [correctAnswer, ...incorrectAnswers];
  }
}

//--SECTION 3:-ASYNC FUNCTIONS (FETCHING POKEAPI DATA) AND GAME PREPARATION FUNCTIONS--------------------

//3A: ASYNC FUNCTIONS WITH FETCH(), JSON(), and PROMISE.ALLSETTLED()
//grabs info from the pokeAPI regarding a single pokemon
async function getSinglePokeData(num) {
  try {
    //fetches from pokeAPI
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${num}`);
    //parse the pokeAPI data
    const data = await response.json();
    return data; //returns a promise with the single parsed json pokemon data as the success value
  } catch {
    throw new Error(
      'Unable to fetch pokemon data... Please reload the page and try again.'
    );
  }
}

//the function grabs all of the single pokemon data fetches, runs them in parallel, and then stores that data in the global variable, globalPokeData
async function makePokemonDataArray(pokemonIDarr) {
  try {
    //preps an array of promises to be passed to Promise.allsettled. all elements will continue promises for a single pokemon data
    const promiseArray = pokemonIDarr.map(function (pokemonID) {
      return getSinglePokeData(pokemonID);
    });
    //runs all 30 promises in parallel for efficiency
    const globalPokeData = await Promise.allSettled(promiseArray);
    const pokemonDataValues = globalPokeData.map(pokeData => pokeData.value);
    return pokemonDataValues;
  } catch {
    throw new Error(
      'Unable to fetch pokemon data... Please reload the page and try again.'
    );
  }
}

//3B: RANDOM NUMBER FUNCTIONS, ARRAY SHUFFLE FUNCTIONS, SETTING UP THE POKEMON IDS, SETTING UP POKEMON QUESTIONS ARRAY

//helper function that ensures that the pokemon ID array create will NOT contain duplicates
function correctForDuplicateIDs(arr, min, max) {
  let set = new Set(arr);
  while (set.size < 30) {
    let num = createRandomNumber(min, max);
    set.add(num);
  }
  return [...set];
}

//creates a random number based on a passed in range (used all throughout the code)
function createRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

//sets the PokemonNumIDArr
function setPokemonNumIDArr(chosenRegion) {
  let min;
  let max;

  //the pokemon the player will be tested on WILL BE based on player's input, hence this switch statment
  switch (chosenRegion) {
    case 'oldschool':
      min = 1;
      max = 493;
      break;
    case 'newschool':
      min = 494;
      max = 809;
      break;
    default:
      min = 1;
      max = 809;
  }

  for (let i = 0; i <= 29; i++) {
    let num = createRandomNumber(min, max); //ensures randomization of the pokemon hat are being tested
    pokemonNumIDArr.push(num);
  }
  pokemonNumIDArr = correctForDuplicateIDs(pokemonNumIDArr, min, max); //refer to above. it ensures that the pokemonNumID array will not have duplicates
  console.log(pokemonNumIDArr);
}

//used for the question classes to create an answer index array that contains the numbers 1,2,3, and 4 in a random order (refer to section 2 for implementation within the question classes and how it implemented in the answer objects in the answers array)
function shuffleArray(arr) {
  let shuffledArr = [...arr];
  for (let i = 0; i < shuffledArr.length; i++) {
    const j = Math.floor(Math.random() * shuffledArr.length);
    [shuffledArr[i], shuffledArr[j]] = [shuffledArr[j], shuffledArr[i]];
  }
  return shuffledArr;
}

//creates questions from the pokemon data. it considers user's input on what questions they want
function setPokemonQuestionsArr(preference) {
  for (let i = 0; i < 15; i++) {
    let question;

    //creates 3 questions of each type if player chooses "all question types" as their choice
    if (preference === 'all') {
      if (i < 3) {
        question = new pictureQuestion(globalPokeData[i]);
        pokemonQuestionsArr.push(question);
      } else if (i >= 3 && i < 6) {
        question = new typeQuestion(globalPokeData[i]);
        pokemonQuestionsArr.push(question);
      } else if (i >= 6 && i < 9) {
        question = new abilitiesQuestion(globalPokeData[i]);
        pokemonQuestionsArr.push(question);
      } else if (i >= 9 && i < 12) {
        question = new statsQuestion(globalPokeData[i]);
        pokemonQuestionsArr.push(question);
      } else if (i >= 12 && i < 15) {
        question = new heightAndWeightQuestion(globalPokeData[i]);
        pokemonQuestionsArr.push(question);
      }
    }
    //in case they asked for questions of only one type!
    switch (preference) {
      case 'picture':
        question = new pictureQuestion(globalPokeData[i]);
        pokemonQuestionsArr.push(question);
        break;
      case 'type':
        question = new typeQuestion(globalPokeData[i]);
        pokemonQuestionsArr.push(question);
        break;
      case 'abilities':
        question = new abilitiesQuestion(globalPokeData[i]);
        pokemonQuestionsArr.push(question);
        break;
      case 'stats':
        question = new statsQuestion(globalPokeData[i]);
        pokemonQuestionsArr.push(question);
        break;
      case 'height-and-weight':
        question = new heightAndWeightQuestion(globalPokeData[i]);
        pokemonQuestionsArr.push(question);
        break;
      default:
        break;
    }
  }
  console.log(pokemonQuestionsArr);
}

//3C: PREPARING THE GAME FUNCTION
//this will prepare all game questions and then allow the player to start the game ONLY after all questions are loaded!
function prepareAllGameQuestions(pokemonRange, typePreference) {
  lifelines.classList.add('disable-button'); //ensures that the lifelines are NOT clickable prior to the questions actually being loaded and rendered
  setPokemonNumIDArr(pokemonRange); //creates an array of pokemon IDs based on the user's input
  makePokemonDataArray(pokemonNumIDArr) //then, based on the IDs, you fetch all of the pokemon data and store them in an array
    .then(pokemonDataValues => {
      globalPokeData = [...pokemonDataValues]; //stores the array of fetched data of the async function into the global variable
      console.log(globalPokeData);
      setPokemonQuestionsArr(typePreference); //then, after the data is stored, you create the questions (based on the user input)
      setTimeout(() => {
        gamePromptContainer.classList.remove('disable-button'); //now ONLY after all questions are created, then you can start the game (re-enables the start button)
        gamePrompt.textContent = 'QUESTIONS LOADED! CLICK THE BUTTON TO PLAY!'; //prompts user that you're ready to start playing
      }, 400);
    })
    .catch(() =>
      alert(
        'Error with fetching Pokemon data. Please re-load the page or press the "reset game" button and try again.'
      )
    );
}

//-------SECTION 4: DOM MANIPULATION AND EVENT LISTENERS-----------------------------------------------------------------

//4A: ALL QUERY SELECTORS FOR DOM MANIPULATION ----------------------
const headerSection = document.querySelector('.header-section'); //selects the top section of the game
const profile = document.querySelector('.profile'); //selects the profile name section in the top left corner
const toggleAside = document.querySelector('.toggle-aside'); //selects the button that hides/unhides the aside/sidebar
const aside = document.querySelector('aside'); //selects the aside directly
const gamePromptContainer = document.querySelector('.game-prompt-container'); //selects the prompt and start button section on the top right corner
const gamePrompt = document.querySelector('.game-prompt'); //selects ONLY the prompt part of the game prompt/start button section on the top right corner
const answerContainer = document.querySelector('.answer-container'); //selects the entire container containing the four boxes with answers
const questionBox = document.querySelector('.question'); //selects the box containing the question
const bottomSection = document.querySelector('.bottom-section'); //selects the entire bottom section (from the question prompt to the bottom)
const lifelines = document.querySelector('.lifelines-container'); //selects the lifelines container in the top of the aside
const displayQLevel = document.querySelector('.display-question-level'); //selects the box at the top left corner of the answer container
const pokeImage = document.querySelector('.pokemon-image'); //selects the img element in the center of the page
// const pokemonImgContainer = document.querySelector('.pokemon-image-container'); //selects the entire container in the middle (where the img element is embedded)
const bottomButtonsinAside = document.querySelector('.bottom-button-container'); //selects the container with the instructions, settings, and reset game buton
const colorContainer = document.querySelector('.color-container');
const displayInstructions = document.querySelector('.display-instructions');
const popUpBox = document.querySelector('.pop-up-box'); //selects the pop-up box element that pops up when click on instructions or settings
const settings = document.querySelector('.settings'); //selects the settings button specifically
// const gameContainer = document.querySelector('.game-container');
// const entireContainer = document.querySelector('.entire-container');
// const profilePic = document.querySelector('.profile-pic');
const timerElement = document.querySelector('.timer'); //selects the box where the timer will be rendered in the box at the top right corner of the answer box
const resetGameButton = document.querySelector('.reset-game');
//-------------

//4B: HELPER FUNCTIONS THAT RENDER ELEMENTS ONTO THE SCREEN------------

//GOAL: inserts either "Next question" after a player answers a question correctly or "play again" if the player loses the game
function insertButton(buttonText, buttonClass) {
  questionBox.insertAdjacentHTML(
    'afterend',
    `<button
  style="display: block; width: fit-content; margin: auto; padding-left: 5px; padding-right 5px; font-size: 1.1rem; margin-top: 5px;" class = "inserted-button ${buttonClass}"
>${buttonText}</button>`
  );
}

//GOAL: Creates and renders the timer when the patient is actively answering a question
function startCountdownTimer() {
  let count = 30;
  timerElement.textContent = `TIME REMAINING: ${count}`;
  let thisTimer = setInterval(() => {
    count--;
    timerElement.textContent = `TIME REMAINING: ${count}`;
    if (count === 0) {
      console.log(`It's done`);
      loseFromTimeOut();
    }
  }, 1000);
  currentTimer = thisTimer;
}

//Function that defines the sequelae of events when a player runs out of time answer the question
function loseFromTimeOut() {
  //queryselectors to obtain the current question the player is answering, the correct answer to that question, and the box that contains that correct answer
  const currentPokeQuestion = pokemonQuestionsArr[currentQuestionNum - 1];
  const correctAnswerObj = currentPokeQuestion.answers.find(
    answer => answer.isCorrect
  );
  const correctAnswerBox = document.querySelector(
    `.ans${correctAnswerObj.answerNumber}`
  );
  correctAnswerBox.classList.add('green-background'); //highlight the correct answer
  updateAndRenderStreak(); //updates the player's streak since the player lost
  questionBox.textContent = `RAN OUT OF TIME, TRAINER! Gotta be faster next time! Current Streak was ${currentStreak}. Record Streak: ${streakRecord}`; //prompts the player that they lost due to time. Also displays the streak to the player
  currentStreak = 0; //resets the current streak
  continuingStreak = false; //sets the state that the player is no longer holding a streak
  answerContainer.classList.add('disable-button'); //disables player from answering the questions
  lifelines.classList.add('disable-button'); //disables the player from accessing lifelines
  insertButton('Play Again?', 'play-again'); //renders the play-again button
  clearInterval(currentTimer); //turns off the timer
  currentTimer = null; //clears the interval ID
}

function updateAndRenderStreak() {
  streakRecord = currentStreak > streakRecord ? currentStreak : streakRecord;
  profile.innerHTML = ` ${playerTag} <br/> ${playerName} <br/> Record Streak: ${streakRecord}`;
}

//GOAL: when the player presses the start button, or the next question, it updates the UI and presents the next question and re-starts or starts the timer to the question
function renderQuestionAndAnswers() {
  currentQuestionNum++; //increments the current question number. (example, question #2)
  const currentPokeQuestion = pokemonQuestionsArr[currentQuestionNum - 1]; //grabs the current pokemon question based on the current question number
  const previousLvl = document.querySelector(`.lvl${currentQuestionNum - 1}`); //selects the level box of the previous question in the level ladder in the aside
  const currentLvl = document.querySelector(`.lvl${currentQuestionNum}`); //selects the level box of the current question in the level ladder in the aside
  const answerArr = currentPokeQuestion.answers; //grabs the answer array of the current question

  //changes the picture to the pokemon in question in the image in the center
  pokeImage.src = currentPokeQuestion.pokeData.sprites.front_default;

  //changes the content of the question level box in the top right corner of the answer container
  displayQLevel.textContent = `LVL ${currentLvl.textContent}`;

  //the current level is highlighted in the level ladder in the aside. the code below achieves the effect of the highlighted level slowly "climbing up the ladder" as the player progresses through the game
  if (previousLvl) {
    previousLvl.classList.remove('current-level');
  }
  currentLvl.classList.add('current-level');

  //displays the current question in the question box
  questionBox.textContent = currentPokeQuestion.questionPrompt;

  //renders the answers in the appropriate answer boxes in the answer container, based on the answerIndex property of each answer object in the answer array
  answerArr.forEach(answerObj => {
    const answerBox = document.querySelector(`.ans${answerObj.answerNumber}`);
    answerBox.textContent = answerObj.answer;
  });

  //disables the start game button and enables the answer buttons in the quiz
  gamePromptContainer.classList.add('disable-button');
  answerContainer.classList.remove('disable-button');
  startCountdownTimer(); //starts the countdown timer
}

function resetGame(message, playerWon = false) {
  const answers = document.querySelectorAll('.answer');
  const levels = document.querySelectorAll('.level');
  const playAgain = document.querySelector('.play-again');
  currentQuestionNum = 0; //current question is 0
  globalPokeData.length = 0; //clear pokedata array
  pokemonNumIDArr.length = 0; //clear pokemonNum ID array
  pokemonQuestionsArr.length = 0; //clear pokeQuestions array
  if (currentTimer) {
    //resets timer
    clearInterval(currentTimer);
    currentTimer = null;
  }
  timerElement.textContent = 'Timer will be here!';
  if (!playerWon) {
    //resets streak
    currentStreak = 0;
    continuingStreak = false;
  }
  //update UI (question box, backgrounds for all answers, etc)
  questionBox.textContent = message;
  displayQLevel.textContent = 'Question Level will go here!';
  answers.forEach((answer, i) => {
    const alphabetArr = ['A', 'B', 'C', 'D'];
    answer.textContent = `Answer ${alphabetArr[i]}`;
    answer.classList.remove('red-background');
    answer.classList.remove('green-background');
    answer.classList.remove('strikethrough');
  });
  //reset the levels in the sidebar
  levels.forEach(level => {
    level.classList.remove('current-level');
  });
  //display picture of oak
  pokeImage.src = pokeImage.dataset.oak;
  gamePrompt.textContent = 'LOADING NEW QUESTIONS! PLEASE WAIT...';
  //re-prepare all the questions to produce new questions
  prepareAllGameQuestions(userPokemonRange, questionTypePreference);
  //remove the playAgain button if it's present
  if (playAgain) {
    playAgain.remove();
  }
}

//renders the UI accordingly when the player answers all the question correctly
function renderWinScreen() {
  questionBox.textContent = `CONGRATS!! YOU WON THE GAME, SUPER TRAINER! You really know your stuff! Your current streak is ${currentStreak}. Can you continue that streak? Press "play again" to keep on going with a fresh set of questions!`;
  updateAndRenderStreak(); //updates the streak
  continuingStreak = true; //allows the player to continue building on their streak
  insertButton('Play Again?', 'play-again'); //inserts the play again buton
}

//fades in or out the entire background/game container
function fadeOrBrightenBackGrnd() {
  const pokemonImgContainer = document.querySelector(
    '.pokemon-image-container'
  ); //selects the entire container in the middle (where the img element is embedded) this is the only place where I select the pokemonImg container. Thus, it will be local to this function
  headerSection.classList.toggle('decrease-opacity');
  pokemonImgContainer.classList.toggle('decrease-opacity');
  bottomSection.classList.toggle('decrease-opacity');
}

//deactivates all buttons at once (if the settings or instructions button is presssed)
function deactivateAllButtons() {
  lifelines.classList.add('disable-all');
  bottomButtonsinAside.classList.add('disable-all');
  answerContainer.classList.add('disable-all');
  gamePromptContainer.classList.add('disable-all');
}

//reactivates all buttons at once
function reactivateAllButtons() {
  lifelines.classList.remove('disable-all');
  bottomButtonsinAside.classList.remove('disable-all');
  answerContainer.classList.remove('disable-all');
  gamePromptContainer.classList.remove('disable-all');
}

//4C---------------EVENT LISTENERS--------------
//TOGGLE ASIDE BUTTON: enables so that when you click on the arrow div in the aside, it hides or displays the aside
toggleAside.addEventListener('click', function () {
  aside.classList.toggle('translate-away');
  setTimeout(() => {
    aside.classList.toggle('display-none');
  }, 450);
});

//render the UI to display the question and activate all lifelines when START BUTTON IS CLICKED
gamePromptContainer.addEventListener('click', function (e) {
  if (e.target.tagName === 'BUTTON') {
    document.querySelectorAll('.lifeline').forEach(lifeline => {
      lifeline.classList.remove('disable-button');
    });
    lifelines.classList.remove('disable-button');
    renderQuestionAndAnswers();
  }
});

//event listener that will trigger only if the player clicks on an answer button -> renders UI different based on if the answer was correct
answerContainer.addEventListener('click', function (e) {
  const currentPokeQuestion = pokemonQuestionsArr[currentQuestionNum - 1]; //grabs the pokeData of the question the player is currently on
  const chosenAnswerObj = currentPokeQuestion.answers.find(answer => {
    return parseInt(e.target.dataset.num) === answer.answerNumber;
  }); //grabs the answer object that is associated with the option that the player chose
  const correctAnswerObj = currentPokeQuestion.answers.find(
    answer => answer.isCorrect
  ); //grabs the answer object that is associated with the correct answer, in order to compare with what the player chose
  const correctAnswerBox = document.querySelector(
    `.ans${correctAnswerObj.answerNumber}`
  ); //grabs the button element that is associated with the correct answer

  //code only runs if the target was a button element
  if (e.target.tagName === 'BUTTON') {
    //backgroundColor is yellow to notify that the person chose the answer and is pending a response...
    e.target.classList.add('yellow-background');
    clearInterval(currentTimer); //stops the timer and clears the timerID from the global variable
    currentTimer = null;
    //setTimeOut for dramatic effect
    setTimeout(() => {
      e.target.classList.remove('yellow-background');
      lifelines.classList.add('disable-button');
      //if player chose the correct answer...
      if (chosenAnswerObj.isCorrect) {
        e.target.classList.add('green-background'); //to signify if someone is correct
        currentStreak++; //increment streak of questions
        confetti({
          angle: 100,
          particleCount: 100,
          spread: 60,
        }); //throws confetti to congratulate the player (imported from an external library)

        //if the player is at the last question, render the win screen and exit the function
        if (currentQuestionNum === pokemonQuestionsArr.length) {
          renderWinScreen(); //refer to 4A for functionality, but it renders the win screen
          return;
        }
        //otherwise, if the player has not yet won, congratulate for the correct answer and allow the player to access the next question
        questionBox.textContent = 'CORRECT!! YOU GOT THIS!';
        insertButton('Next Question?', 'next-question');

        //if the player chose the wrong answer....
      } else if (!chosenAnswerObj.isCorrect) {
        e.target.classList.add('red-background'); //red to signify the chosen answer was wrong
        correctAnswerBox.classList.add('green-background'); //lets the player know what the correct answer was
        updateAndRenderStreak(); //updates and renders streak to the player's profile in preparation for the end of the game
        questionBox.textContent = `INCORRECT! Sorry about that, ${playerName}... Press "Play Again" to play with different questions! Current Streak was ${currentStreak}. Record Streak: ${streakRecord}`; //prompts user that game is over
        currentStreak = 0; //resets streak
        continuingStreak = false; //indicates that the player is no longer holding a streak
        insertButton('Play Again?', 'play-again'); //provides the player the option to play again if desired.
      }
    }, 1000);
    this.classList.add('disable-button'); //disables the answer buttons
  }
});

bottomSection.addEventListener('click', function (e) {
  if (e.target.classList.contains('next-question')) {
    lifelines.classList.remove('disable-button'); //re-enables the lifeline containers (but not individual lifelines if they have been used already)
    const answerBoxes = document.querySelectorAll('.answer');
    e.target.remove(); //removes the button that was inserted
    //clears all answerboxes of their background color
    answerBoxes.forEach(answerBox => {
      answerBox.classList.remove('red-background');
      answerBox.classList.remove('green-background');
      answerBox.classList.remove('strikethrough');
    }); //clears all red backgrounds, green backgrounds, and strikethroughs
    renderQuestionAndAnswers(); //displays the next question and set of answers
  } else if (e.target.classList.contains('play-again')) {
    //renders differently if play-again was prompted because a player won the game or the player lost
    if (continuingStreak) {
      resetGame(
        `You're doing amazing, ${playerName}! Can you keep on going? Click on the start button on the top right to start again!`,
        true
      );
    } else {
      resetGame(
        `Good on you, for trying the game out again, ${playerName}! Good luck this time! Click on the start button when questions are loaded to start again. `
      );
    }
  }
});

//event listener for the reset game button
resetGameButton.addEventListener('click', function (e) {
  const insertedButton = document.querySelector('.inserted-button');

  //prompts player just to make sure to make sure that the player wants to reset
  let userInput = prompt(
    `Are you sure? Your streak will not be recorded, and you'll be presented will all new Pokemon questions! Please type in "yes" or "no". Capitalization doesn't matter.`
  );
  let alteredInput = userInput.toLowerCase().trimEnd(); //ensures capitalization and whitespace don't matter!
  //ensures a yes or no answer
  while (!['yes', 'no'].includes(alteredInput)) {
    userInput = prompt(
      `Invalid. Please type "yes" or "no" on whether or not you want to reset the game. Captilization doesn't matter.`
    );
    alteredInput = userInput.toLowerCase().trimEnd();
  } //resets game if answer is yes
  if (alteredInput === 'yes') {
    answerContainer.classList.add('disable-button');
    gamePromptContainer.classList.add('disable-button');
    if (insertedButton) {
      insertedButton.remove();
    }
    resetGame(
      `The game will be reset! Enjoy your new questions, ${playerName}! Click the start button to begin again!`
    );
    return;
  } else if (alteredInput === 'no') {
    return; //otherwise, return to the game
  }
});

//event listener for the change background buttons in the footer
colorContainer.addEventListener('click', function (e) {
  if (e.target.classList.contains('theme')) {
    //finds backgroundStyle object associated with the clicked backgroundtheme
    const chosenTheme = backgroundStyles.find(
      style => e.target.dataset.color === style.color
    );

    //changes the gradient color scheme of the header container and bottom container based on the chosen theme
    headerSection.style.background = `linear-gradient(to right, ${chosenTheme.lighter}, ${chosenTheme.darker})`;
    bottomSection.style.background = `linear-gradient(to right, ${chosenTheme.darker}, ${chosenTheme.lighter})`;

    //obtains the external css stylesheet
    const targetStyleSheet = Array.from(document.styleSheets).find(
      sheet => sheet.href && sheet.href.includes('style.css')
    );

    //finds the '.current-level' class selector in the form of an object!
    const currentLevelStyle = Array.from(targetStyleSheet.rules).find(
      rule => rule.selectorText === '.current-level'
    );

    //finds the 'button:hover' class selector in the form of an object!
    const buttonHoverStyle = Array.from(targetStyleSheet.rules).find(
      rule => rule.selectorText === 'button:hover'
    );

    //changes the background color of the level ladder and button-hover color based on the theme chosen.
    currentLevelStyle.style.backgroundColor = chosenTheme.highlight;
    buttonHoverStyle.style.backgroundColor = chosenTheme.highlight;
  }
});

//displays the instructions when the button is clicked
displayInstructions.addEventListener('click', function () {
  fadeOrBrightenBackGrnd(); //fades the background
  deactivateAllButtons(); //turns off all buttons while instructions are up
  setTimeout(() => {
    popUpBox.innerHTML = instructionsHTML; //HTML for the instructions box is inside of a separate div in the HTML. I stored the div's inner HTML in a global variable and only use it for this function
    popUpBox.classList.toggle('display-none'); //allows for fade to happen, then displays the box
  }, 600);
});

settings.addEventListener('click', function () {
  fadeOrBrightenBackGrnd(); //fades background
  deactivateAllButtons(); //turns off all buttons while settings are up
  setTimeout(() => {
    popUpBox.innerHTML = settingsHTML; //same thing for the settings HTML
    popUpBox.classList.toggle('display-none'); //allows for fade to happen, then displays the box
  }, 600);
});

popUpBox.addEventListener('click', function (e) {
  if (e.target.classList.contains('exit-modal')) {
    //if it says "exit without saving", just close the box and do nothing
    popUpBox.classList.toggle('display-none');
    fadeOrBrightenBackGrnd();
    reactivateAllButtons();
  }
  if (e.target.classList.contains('submit-settings')) {
    //if settings are up, submit new settings and re-prepare all questions
    e.preventDefault();
    const settingsRange = document.querySelector('#settings-range');
    const settingsQuestionType = document.querySelector(
      '#settings-question-type'
    );
    //updates all global variables about the user's preferences
    userPokemonRange = settingsRange.value;
    questionTypePreference = settingsQuestionType.value;
    //remove pop-up box, brighten background, re-active game
    popUpBox.classList.toggle('display-none');
    fadeOrBrightenBackGrnd();
    reactivateAllButtons();
    //resets the streak
    streakRecord = 0;
    profile.innerHTML = ` ${playerTag} <br/> ${playerName} <br/> Record Streak: ${streakRecord}`;
    answerContainer.classList.add('disable-button'); //ensures that the answer container is no longer active when settings are changed
    //resets game with new preferences
    resetGame(
      'Game is reset with all question preferences and pokemon range preferences updated! Click the start button on the top right corner to start! Enjoy the game!'
    );
  }
});

//event listeners for lifelines
lifelines.addEventListener('click', function (e) {
  //50/50
  if (e.target.classList.contains('fifty-fifty')) {
    //grabs the current question and makes an array of all the wrong answers
    const currentPokeQuestion = pokemonQuestionsArr[currentQuestionNum - 1];
    const wrongAnswers = currentPokeQuestion.answers.filter(
      answer => answer.isCorrect === false
    );
    wrongAnswers.pop(); //get rid of one answer so it's just an array of 2 wrong answers
    //for each wrong answer, strike through them so player knows those answers are wrong
    wrongAnswers.forEach(answer => {
      const answerBox = document.querySelector(`.ans${answer.answerNumber}`);
      answerBox.classList.add('strikethrough');
    });
    e.target.classList.add('disable-button'); //disables the 50/50 button ONLY (so that it's not used for the rest of the round!)
  }

  if (e.target.classList.contains('change-question')) {
    //stops timer and resets timer interval
    clearInterval(currentTimer);
    currentTimer = null;
    let newQuestion = {}; //preps the new question

    //changes the question based on the type preferences of the player
    //if all questions are live, the code ensures the question type will be the same
    //the new question is based on the last element of the globalPokeData array, which is not being used in the current game
    if (questionTypePreference === 'all') {
      if (currentQuestionNum <= 3) {
        newQuestion = new pictureQuestion(globalPokeData.at(-1));
      } else if (currentQuestionNum > 3 && currentQuestionNum <= 6) {
        newQuestion = new typeQuestion(globalPokeData.at(-1));
      } else if (currentQuestionNum > 6 && currentQuestionNum <= 9) {
        newQuestion = new abilitiesQuestion(globalPokeData.at(-1));
      } else if (currentQuestionNum > 9 && currentQuestionNum <= 12) {
        newQuestion = new statsQuestion(globalPokeData.at(-1));
      } else if (currentQuestionNum > 12 && currentQuestionNum <= 15) {
        newQuestion = new heightAndWeightQuestion(globalPokeData.at(-1));
      }
    }

    //ensures the right question type will be switched out
    switch (questionTypePreference) {
      case 'picture':
        newQuestion = new pictureQuestion(globalPokeData.at(-1));
        break;
      case 'type':
        newQuestion = new typeQuestion(globalPokeData.at(-1));
        break;
      case 'abilities':
        newQuestion = new abilitiesQuestion(globalPokeData.at(-1));
        break;
      case 'stats':
        newQuestion = new statsQuestion(globalPokeData.at(-1));
        break;
      case 'height-and-weight':
        newQuestion = new heightAndWeightQuestion(globalPokeData.at(-1));
        break;
      default:
        break;
    }
    //in case the player used the 50/50 prior to changing the question, this removes all strikethroughs in the answer element boxes as to avoid confusion when the question is changed
    const answers = document.querySelectorAll('.answer');
    answers.forEach(answer => answer.classList.remove('strikethrough'));
    pokemonQuestionsArr.splice(currentQuestionNum - 1, 1, newQuestion); //replace the question in the pokemonQuestionArr with the new question
    currentQuestionNum--; //to ensure that when the quesiton is switched, the player is still on the same question number
    answerContainer.classList.add('disable-button'); //disables the answer container (because the renderQuestionAndAnswers function will remove it anyways)
    e.target.classList.add('disable-button'); //renders change question unusable for the rest of the round
    renderQuestionAndAnswers();
  }
});

//SECTION 5: INTRO SCREEN CODE------------------------------------------------

//Promisifying setTimeout to avoid nested callbacks when doing the intro screen welcome greetings
function wait(seconds) {
  return new Promise(resolve => {
    setTimeout(resolve, seconds * 1000);
  });
}

//selecting the container and intro screen text in the intro screen
const introScreen = document.querySelector('.intro-screen');
const introScreenText = document.querySelector('.intro-screen-text');

//NOTE THE BELOW CODE GIVES THE EFFECT OF TEXT FADING IN AND OUT DURING THE INTRO SCREEN
//wait one second, then fade in the background
wait(1)
  .then(() => {
    introScreenText.classList.add('fade-in');
    return wait(2);
  }) //wait two seconds, then fade out
  .then(() => {
    introScreenText.classList.add('fade-out');
    introScreenText.classList.remove('fade-in');
    return wait(2);
  }) //wait two seconds then fade in with new message
  .then(() => {
    introScreenText.innerHTML =
      '<p class="welcome-statement">In this game, we will be testing your knowledge on Pokemon! </p>';
    introScreenText.classList.add('fade-in');
    introScreenText.classList.remove('fade-out');
    return wait(2);
  }) //wait 2 seconds, then fade out message
  .then(() => {
    introScreenText.classList.add('fade-out');
    introScreenText.classList.remove('fade-in');
    return wait(2);
  }) //wait two seconds then fade in new message
  .then(() => {
    introScreenText.innerHTML =
      '<p class="welcome-statement">You will be given 15 questions to answer per round! Questions can range from identifying Pokemon images, Pokemon types, Pokemon abilities, and MORE!</p>';
    introScreenText.classList.add('fade-in');
    introScreenText.classList.remove('fade-out');
    return wait(3.5);
  }) //wait 3.5 seconds then fade out message
  .then(() => {
    introScreenText.classList.add('fade-out');
    introScreenText.classList.remove('fade-in');
    return wait(2);
  }) //wait two seconds then fade in new message
  .then(() => {
    introScreenText.innerHTML =
      '<p class="welcome-statement">You will be tested on all Pokemon spanning multiple generations! And plus, each test will always be different!</p>';
    introScreenText.classList.add('fade-in');
    introScreenText.classList.remove('fade-out');
    return wait(3);
  }) //wait three seconds then fade out message
  .then(() => {
    introScreenText.classList.add('fade-out');
    introScreenText.classList.remove('fade-in');
    return wait(2);
  }) //wait two seconds then fade in new message
  .then(() => {
    introScreenText.innerHTML =
      '<p class="welcome-statement">DO YOU HAVE WHAT IT TAKES TO BE A POKETRIVIA MASTER? LETS FIND OUT!</p>';
    introScreenText.classList.add('fade-in');
    introScreenText.classList.remove('fade-out');
  })
  .then(() => {
    introScreenText.classList.add('fade-out');
    introScreenText.classList.remove('fade-in');
    return wait(0.5);
  })
  .then(() => {
    introScreenText.innerHTML = introScreenFormHTML;
    introScreenText.classList.add('fade-in');
    introScreenText.classList.remove('fade-out');
  })
  .catch(err => {
    alert('Problems with loading the page. Please re-load the game.');
  });

//ADDS LOGIC TO WHEN THE SUBMIT BUTTON ON THE FORM IS PRESENTED
introScreen.addEventListener('click', function (e) {
  if (e.target.tagName === 'BUTTON') {
    e.preventDefault();
    const gameContainer = document.querySelector('.game-container');
    const entireContainer = document.querySelector('.entire-container');
    const profilePic = document.querySelector('.profile-pic');
    const inputtedTag = document.querySelector('#trainer-tag');
    const inputtedName = document.querySelector('#intro-name-form');
    const inputtedIcon = document.querySelector('#trainer-icon');
    const inputtedRange = document.querySelector('#intro-screen-range');
    const inputtedQType = document.querySelector('#intro-question-type');

    //updateUI and global variables based on the player's input
    playerTag = inputtedTag.value;
    playerName = inputtedName.value;
    userPokemonRange = inputtedRange.value;
    questionTypePreference = inputtedQType.value;
    profilePic.src = profilePic.dataset[inputtedIcon.value];
    profile.innerHTML = ` ${playerTag} <br/> ${playerName}`;

    //sets up the game
    resetGame(
      `Welcome ${playerName}! Please click on the start button on the top right corner to begin your game! Be sure to read the instructions in the sidebar before you play. You may change settings via the button in the sidebar on the right. Good luck! -Prof Oak`
    );

    //after the form is submited, then do one more text animation sequence
    wait(0)
      .then(() => {
        introScreenText.classList.add('fade-out');
        introScreenText.classList.remove('fade-in');
        return wait(2);
      }) //wait 2 seconds, then prof oak has some last words...
      .then(() => {
        introScreenText.innerHTML = `<p class="welcome-statement"> You'll do great, ${playerName}. Go for the longest streak you can! The sky is the limit!`;
        introScreenText.classList.add('fade-in');
        introScreenText.classList.remove('fade-out');
        return wait(3);
      }) //then render the actual game screen
      .then(() => {
        introScreen.classList.add('fade-out');
        return wait(1);
      })
      .then(() => {
        introScreen.style.display = 'none';
        return wait(1);
      })
      .then(() => {
        entireContainer.style.background = 'black';
        entireContainer.style.height = '100%';
        gameContainer.classList.remove('display-none');
        aside.classList.remove('display-none');
        gameContainer.classList.add('fade-in');
        aside.classList.add('fade-in');
      })
      .catch(() => {
        alert('Problems with loading the page. Please re-load the game.');
      });
  }
});
