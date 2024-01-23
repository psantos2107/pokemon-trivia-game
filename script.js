'use strict';
import confetti from 'https://cdn.skypack.dev/canvas-confetti';

//----SECTION 1: GLOBAL VARIABLES and query selectors ----------------------------------------------------
let globalPokeData = []; //will contain data for up to 30 different pokemon
let pokemonNumIDArr = []; //will contain the IDs of the pokemon that will be used to fetch data from pokeAPI
let pokemonQuestionsArr = []; //will contain questions to be used for the game
let currentQuestionNum = 0; //to keep track of what question the player is on
let currentStreak = 0; //to keep track of how many questions in a row a player has gotten correct in a row currently
let streakRecord = 0; //best record of the player
let continuingStreak = false; //to describe the state of whether a play has an ongoing streak
let userPokemonRange = 'oldschool'; //user's preference for the pokemon range
let questionTypePreference = 'all'; //user's preference for the type of questions desired
let playerTag = '';
let playerName = '';

//used to organize the different "themes" that I want to implement
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
document.querySelector('.settings-HTML').remove(); //removed this node to prevent multiple elements from having the same IDs
//---SECTION 2A: CLASSES and OBJECTS -------------------------------------------------

//BASE QUESTION CLASS------
//question class used to model all the different types of questions
class Question {
  constructor(pokeData) {
    this.pokeData = pokeData; //pokemon data from the pokeAPI be used to formulate each question and its answers
    this.answerIndex = shuffleArray([1, 2, 3, 4]); //indices will be used to determine where in the DOM answer choices will be placed
  }

  //other data from the globalPokeData will be used to devise a question's incorrect choices. Thus, each question class will have the ability to utilize data from any pokemon in the globalPokeData array in order to create wrong answers for the question
  makeThreeRandomIndicesArray() {
    const randomIndicesArr = [];
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

    //creates an array of three random indices which will serve as indices to create incorrect answers from the wrongAnswerPokeData array
    const randomIndices = this.makeThreeRandomIndicesArray();
    randomIndices.forEach((randomIndex, i) => {
      //creation of the incorrect answer object
      const incorrectAnswer = {
        isCorrect: false,
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

//POKEMON PICTURE QUESTION SUBCLASS---------------------------------
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
    //creation of the correct answer object. note, each answer object will have isCorrect (denoting if an answer is correct), the actual answer, and the answerNumber (this will determine where the answer will be placed in the DOM)
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

//POKEMON TYPE QUESTION SUBCLASS------------------------------------
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

  get questionPrompt() {
    return this._questionPrompt;
  }

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
        randomIndex1 = createRandomNumber(0, this.pokemonTypes.length); //create random num from 0-17
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

//POKEMON ABILIITY QUESTION SUBCLASS----------------------------
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

  get questionPrompt() {
    return this._questionPrompt;
  }

  set questionPrompt(pokeData) {
    this._questionPrompt = `${this.capitalizeString(
      pokeData.name
    )} can have which of the following sets of abilities?`;
  }
}

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

//-------HEIGHT AND WEIGHT SUBCLASS -------------------------------
class heightAndWeightQuestion extends Question {
  constructor(pokeData) {
    super(pokeData);
    this.questionPrompt = pokeData;
    this.answers = pokeData;
  }

  retrieveHeightAndWeight(pokeData) {
    //note: the height provided by the pokeAPI was in decimeters. Thus, i converted it to feet within this retrieve method. For weight, I did the same thing, where I converted the weight value in the pokeAPI to lbs within this retrieve method
    //prettier-ignore
    return `Height: ${(pokeData.height * 0.328084).toFixed(2)} ft, Weight: ${(pokeData.weight * 0.22).toFixed(2)}lbs`;
  }

  get questionPrompt() {
    return this._questionPrompt;
  }

  set questionPrompt(pokeData) {
    this._questionPrompt = `Which of the following answers correctly displays the height and weight of ${this.capitalizeString(
      pokeData.name
    )}?`;
  }

  get answers() {
    return this._answers;
  }

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

//------------ASYNC FUNCTIONS (FETCHING POKEAPI DATA)--------------------
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

//creates a pokemon array to be used for the questions that will be displayed
async function makePokemonDataArray(pokemonIDarr) {
  try {
    //preps an array of promises to be passed to Promise.allsettled
    const promiseArray = pokemonIDarr.map(function (pokemonID) {
      return getSinglePokeData(pokemonID);
    });
    //runs all 15 promises in parallel for efficiency
    const globalPokeData = await Promise.allSettled(promiseArray);
    //maps the value property of all the success vales of the 15 promises to be returned as an array of pokemon data derived from the fulfilled promises
    const pokemonDataValues = globalPokeData.map(pokeData => pokeData.value);
    return pokemonDataValues;
  } catch {
    throw new Error(
      'Unable to fetch pokemon data... Please reload the page and try again.'
    );
  }
}

//----ALL QUERY SELECTORS FOR DOM MANIPULATION -------------------------------------
const headerSection = document.querySelector('.header-section');
const profile = document.querySelector('.profile');
const toggleAside = document.querySelector('.toggle-aside');
const aside = document.querySelector('aside');
const gamePromptContainer = document.querySelector('.game-prompt-container');
const gamePrompt = document.querySelector('.game-prompt');
const answerContainer = document.querySelector('.answer-container');
const questionBox = document.querySelector('.question');
const bottomSection = document.querySelector('.bottom-section');
const lifelines = document.querySelector('.lifelines-container');
const displayQLevel = document.querySelector('.display-question-level');
const pokeImage = document.querySelector('.pokemon-image');
const pokemonImgContainer = document.querySelector('.pokemon-image-container');
const bottomButtonsinAside = document.querySelector('.bottom-button-container');
const colorContainer = document.querySelector('.color-container');
const displayInstructions = document.querySelector('.display-instructions');
const popUpBox = document.querySelector('.pop-up-box');
const exitButton = document.querySelector('.exit-button');
const settings = document.querySelector('.settings');
const gameContainer = document.querySelector('.game-container');
const entireContainer = document.querySelector('.entire-container');
const profilePic = document.querySelector('.profile-pic');
//

function insertButton(buttonText, buttonClass) {
  questionBox.insertAdjacentHTML(
    'afterend',
    `<button
  style="display: block; width: fit-content; margin: auto; padding-left: 5px; padding-right 5px; font-size: 1.1rem; margin-top: 5px;" class = "inserted-button ${buttonClass}"
>${buttonText}</button>`
  );
}

function renderQuestionAndAnswers() {
  currentQuestionNum++;
  const currentPokeQuestion = pokemonQuestionsArr[currentQuestionNum - 1]; //index1
  const previousLvl = document.querySelector(`.lvl${currentQuestionNum - 1}`); //level1
  const currentLvl = document.querySelector(`.lvl${currentQuestionNum}`); //level2
  const answerArr = currentPokeQuestion.answers;

  pokeImage.src = currentPokeQuestion.pokeData.sprites.front_default;
  displayQLevel.textContent = `LVL ${currentLvl.textContent}`;
  if (previousLvl) {
    previousLvl.classList.remove('current-level');
  }
  currentLvl.classList.add('current-level'); //currentLvl = level 1
  questionBox.textContent = currentPokeQuestion.questionPrompt;
  answerArr.forEach(answerObj => {
    const answerBox = document.querySelector(`.ans${answerObj.answerNumber}`);
    answerBox.textContent = answerObj.answer;
  });
  gamePromptContainer.classList.add('disable-button');
  answerContainer.classList.toggle('disable-button');
}

function renderWinScreen() {
  questionBox.textContent = `CONGRATS!! YOU WON THE GAME, SUPER TRAINER! You really know your stuff! Your current streak is ${currentStreak}. Can you continue that streak? Press "play again" to keep on going with a fresh set of questions!`;
  updateAndRenderStreak();
  continuingStreak = true;
  insertButton('Play Again?', 'play-again');
}

function updateAndRenderStreak() {
  streakRecord = currentStreak > streakRecord ? currentStreak : streakRecord;
  profile.innerHTML = ` ${playerTag} <br/> ${playerName} <br/> Record Streak: ${streakRecord}`;
}

//toggle button
toggleAside.addEventListener('click', function () {
  aside.classList.toggle('translate-away');
  setTimeout(() => {
    aside.classList.toggle('hide-element');
  }, 450);
});

// toggleAside.addEventListener('mouseenter', function (e) {
//   toggleAside.style.backgroundColor = '#de9a8e';
// });

// toggleAside.addEventListener('mouseleave', function (e) {
//   toggleAside.style.backgroundColor = 'var(--off-white-block-background)';
// });

gamePromptContainer.addEventListener('click', function (e) {
  if (e.target.tagName === 'BUTTON') {
    document.querySelectorAll('.lifeline').forEach(lifeline => {
      lifeline.classList.remove('disable-button');
    });
    lifelines.classList.remove('disable-button');
    renderQuestionAndAnswers();
  }
});

answerContainer.addEventListener('click', function (e) {
  //grabs the pokeData of the question the player is currently on
  const currentPokeQuestion = pokemonQuestionsArr[currentQuestionNum - 1];
  //grabs the answer object that is associated with the option that the player chose
  const chosenAnswerObj = currentPokeQuestion.answers.find(answer => {
    return parseInt(e.target.dataset.num) === answer.answerNumber;
  });
  //grabs the answer object that is associated with the correct answer, in order to compare with what the player chose
  const correctAnswerObj = currentPokeQuestion.answers.find(
    answer => answer.isCorrect
  );
  //grabs the button element that is associated with the correct answer
  const correctAnswerBox = document.querySelector(
    `.ans${correctAnswerObj.answerNumber}`
  );

  //code only runs if the target was a button element
  if (e.target.tagName === 'BUTTON') {
    //backgroundColor is yellow to notify that the person chose the answer and is pending a response...
    e.target.classList.add('yellow-background');

    //setTimeOut for dramatic effect
    setTimeout(() => {
      e.target.classList.remove('yellow-background');
      lifelines.classList.add('disable-button');
      //if player chose the correct answer...
      if (chosenAnswerObj.isCorrect) {
        e.target.classList.add('green-background'); //to signify if someone is correct
        currentStreak++; //increment streak of questions
        confetti(); //throws confetti to congratulate the player (imported from an external library)

        //if the player is at the last question, render the win screen and exit the function
        if (currentQuestionNum === pokemonQuestionsArr.length) {
          renderWinScreen();
          return;
        }
        //otherwise, congratulate and allow the player to access the next question
        questionBox.textContent = 'CORRECT!! YOU GOT THIS!';
        insertButton('Next Question?', 'next-question');

        //if the player chose the wrong answer....
      } else if (!chosenAnswerObj.isCorrect) {
        e.target.classList.add('red-background');
        correctAnswerBox.classList.add('green-background');
        updateAndRenderStreak(); //updates and renders streak to the player's profile in preparation for the end of the game
        questionBox.textContent = `INCORRECT! Sorry about that, trainer... Press "Play Again" to play with different questions! Current Streak was ${currentStreak}. Record Streak: ${streakRecord}`; //prompts user that game is over
        currentStreak = 0; //resets streak
        continuingStreak = false; //indicates that the player is no longer holding a streak
        insertButton('Play Again?', 'play-again'); //provides the player the option to play again if desired.
      }
    }, 1000);
    this.classList.toggle('disable-button');
  }
});

bottomSection.addEventListener('click', function (e) {
  if (e.target.classList.contains('next-question')) {
    lifelines.classList.remove('disable-button');
    const answerBoxes = document.querySelectorAll('.answer');
    e.target.remove(); //removes the button that was inserted
    //clears all answerboxes of their background color
    answerBoxes.forEach(answerBox => {
      answerBox.classList.remove('red-background');
      answerBox.classList.remove('green-background');
      answerBox.classList.remove('strikethrough');
    });
    renderQuestionAndAnswers(); //displays the next question and set of answers
  } else if (e.target.classList.contains('play-again')) {
    if (continuingStreak) {
      resetGame(
        `You're doing amazing, trainer! The sky is the limit! Click on the start button on the top right to start again!`
      );
    } else {
      resetGame(
        'Good on you, for trying the game out again, trainer! Good luck this time! Click on the start button when questions are loaded to start again. '
      );
    }
  }
});

bottomButtonsinAside.addEventListener('click', function (e) {
  const insertedButton = document.querySelector('.inserted-button');
  if (e.target.classList.contains('reset-game')) {
    let userInput = prompt(
      `Are you sure? Your streak will not be recorded, and you'll be presented will all new Pokemon questions! Please type in "yes" or "no". Capitalization doesn't matter.`
    );
    let alteredInput = userInput.toLowerCase().trimEnd(); //ensures capitalization and whitespace don't matter!
    while (!['yes', 'no'].includes(alteredInput)) {
      userInput = prompt(
        `Invalid. Please type "yes" or "no" on whether or not you want to reset the game. Captilization doesn't matter.`
      );
      alteredInput = userInput.toLowerCase().trimEnd();
    }
    if (alteredInput === 'yes') {
      answerContainer.classList.add('disable-button');
      gamePromptContainer.classList.add('disable-button');
      if (insertedButton) {
        insertedButton.remove();
      }
      resetGame(
        'The game will be reset! Enjoy your new questions, trainer! Click the start button to begin again!'
      );
      return;
    } else if (alteredInput === 'no') {
      return;
    }
  }
});

function resetGame(message) {
  const answers = document.querySelectorAll('.answer');
  const levels = document.querySelectorAll('.level');
  const playAgain = document.querySelector('.play-again');
  currentQuestionNum = 0; //current question is 0
  globalPokeData.length = 0; //clear pokedata array
  pokemonNumIDArr.length = 0; //clear pokemonNum ID array
  pokemonQuestionsArr.length = 0; //clear pokeQuestions array
  currentStreak = 0;
  continuingStreak = false;
  questionBox.textContent = message;
  displayQLevel.textContent = 'Question Level will go here!';
  answers.forEach((answer, i) => {
    const alphabetArr = ['A', 'B', 'C', 'D'];
    answer.textContent = `Answer ${alphabetArr[i]}`;
    answer.classList.remove('red-background');
    answer.classList.remove('green-background');
    answer.classList.remove('strikethrough');
  });
  levels.forEach(level => {
    level.classList.remove('current-level');
  });
  pokeImage.src = pokeImage.dataset.oak;
  gamePrompt.textContent = 'LOADING NEW QUESTIONS! PLEASE WAIT...';
  prepareAllGameQuestions(userPokemonRange, questionTypePreference);
  if (playAgain) {
    playAgain.remove();
  }
}

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

function correctForDuplicateIDs(arr, min, max) {
  let set = new Set(arr);
  while (set.size < 30) {
    let num = createRandomNumber(min, max);
    set.add(num);
  }
  return [...set];
}

function createRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

//sets the PokemonNumIDArr
function setPokemonNumIDArr(chosenRegion) {
  let min;
  let max;

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
    let num = createRandomNumber(min, max);
    pokemonNumIDArr.push(num);
  }
  pokemonNumIDArr = correctForDuplicateIDs(pokemonNumIDArr, min, max);
  console.log(pokemonNumIDArr);
}

function shuffleArray(arr) {
  let shuffledArr = [...arr];
  for (let i = 0; i < shuffledArr.length; i++) {
    const j = Math.floor(Math.random() * shuffledArr.length);
    [shuffledArr[i], shuffledArr[j]] = [shuffledArr[j], shuffledArr[i]];
  }
  return shuffledArr;
}

function setPokemonQuestionsArr(preference) {
  for (let i = 0; i < 15; i++) {
    let question;
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

function prepareAllGameQuestions(pokemonRange, typePreference) {
  setPokemonNumIDArr(pokemonRange);
  lifelines.classList.add('disable-button');
  makePokemonDataArray(pokemonNumIDArr)
    .then(pokemonDataValues => {
      globalPokeData = [...pokemonDataValues];
      console.log(globalPokeData);
      setPokemonQuestionsArr(typePreference);
      setTimeout(() => {
        gamePromptContainer.classList.remove('disable-button');
        gamePrompt.textContent = 'QUESTIONS LOADED! CLICK THE BUTTON TO PLAY!';
      }, 400);
    })
    .catch(() =>
      alert(
        'Error with fetching Pokemon data. Please re-load the page or press the "reset game" button and try again.'
      )
    );
}

function fadeOrBrightenBackGrnd() {
  headerSection.classList.toggle('decrease-opacity');
  pokemonImgContainer.classList.toggle('decrease-opacity');
  bottomSection.classList.toggle('decrease-opacity');
}

function deactivateAllButtons() {
  lifelines.classList.add('disable-all');
  bottomButtonsinAside.classList.add('disable-all');
  answerContainer.classList.add('disable-all');
  gamePromptContainer.classList.add('disable-all');
}

function reactivateAllButtons() {
  lifelines.classList.remove('disable-all');
  bottomButtonsinAside.classList.remove('disable-all');
  answerContainer.classList.remove('disable-all');
  gamePromptContainer.classList.remove('disable-all');
}

displayInstructions.addEventListener('click', function () {
  fadeOrBrightenBackGrnd(); //refer to function above
  deactivateAllButtons();
  setTimeout(() => {
    popUpBox.innerHTML = instructionsHTML;
    popUpBox.classList.toggle('display-none');
  }, 600);
});

settings.addEventListener('click', function () {
  fadeOrBrightenBackGrnd();
  deactivateAllButtons();
  setTimeout(() => {
    popUpBox.innerHTML = settingsHTML;
    popUpBox.classList.toggle('display-none');
  }, 600);
});

popUpBox.addEventListener('click', function (e) {
  if (e.target.classList.contains('exit-modal')) {
    popUpBox.classList.toggle('display-none');
    fadeOrBrightenBackGrnd();
    reactivateAllButtons();
  }
  if (e.target.classList.contains('submit-settings')) {
    const settingsRange = document.querySelector('#settings-range');
    const settingsQuestionType = document.querySelector(
      '#settings-question-type'
    );
    userPokemonRange = settingsRange.value;
    questionTypePreference = settingsQuestionType.value;
    popUpBox.classList.toggle('display-none');
    fadeOrBrightenBackGrnd();
    reactivateAllButtons();
    streakRecord = 0;
    profile.innerHTML = ` ${playerTag} <br/> ${playerName} <br/> Record Streak: ${streakRecord}`;
    resetGame(
      'Game is reset with all question preferences and pokemon range preferences updated! Click the start button on the top right corner to start! Enjoy the game!'
    );
  }
});

lifelines.addEventListener('click', function (e) {
  if (e.target.classList.contains('fifty-fifty')) {
    const currentPokeQuestion = pokemonQuestionsArr[currentQuestionNum - 1];
    const wrongAnswers = currentPokeQuestion.answers.filter(
      answer => answer.isCorrect === false
    );
    wrongAnswers.pop();
    wrongAnswers.forEach(answer => {
      const answerBox = document.querySelector(`.ans${answer.answerNumber}`);
      answerBox.classList.add('strikethrough');
    });
    e.target.classList.add('disable-button');
  }

  if (e.target.classList.contains('change-question')) {
    let newQuestion = {};
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
    pokemonQuestionsArr.splice(currentQuestionNum - 1, 1, newQuestion);
    currentQuestionNum--;
    answerContainer.classList.add('disable-button');
    e.target.classList.add('disable-button');
    renderQuestionAndAnswers();
  }
});

//--------INTRO SCREEN LOGIC AND INITIAL CODE EXECUTION----------------

//Promisifying setTimeout to avoid nested callbacks when doing the intro screen welcome greetings
function wait(seconds) {
  return new Promise(resolve => {
    setTimeout(resolve, seconds * 1000);
  });
}

//selecting the container and intro screen text in the intro screen
const introScreen = document.querySelector('.intro-screen');
const introScreenText = document.querySelector('.intro-screen-text');

//fade in the orginal
introScreenText.classList.add('fade-in');
wait(1.5) //wait 1.5 seconds, then fade out to show the next message
  .then(() => {
    introScreenText.classList.add('fade-out');
    introScreenText.classList.remove('fade-in');
    return wait(2);
  })
  .then(() => {
    introScreenText.innerHTML =
      '<p class="welcome-statement">In this game, we will be testing your knowledge on Pokemon! </p>';
    introScreenText.classList.add('fade-in');
    introScreenText.classList.remove('fade-out');
    return wait(2);
  }) //wait 2 seconds, then fade out to show the next message
  .then(() => {
    introScreenText.classList.add('fade-out');
    introScreenText.classList.remove('fade-in');
    return wait(2);
  })
  .then(() => {
    introScreenText.innerHTML =
      '<p class="welcome-statement">You will be given 15 questions to answer per round! Questions can range from identifying Pokemon images, Pokemon types, Pokemon abilities, and MORE!</p>';
    introScreenText.classList.add('fade-in');
    introScreenText.classList.remove('fade-out');
    return wait(2);
  })
  .then(() => {
    introScreenText.classList.add('fade-out');
    introScreenText.classList.remove('fade-in');
    return wait(2);
  })
  .then(() => {
    introScreenText.innerHTML =
      '<p class="welcome-statement">You will be tested on all Pokemon spanning multiple generations! And plus, each test will always be different!</p>';
    introScreenText.classList.add('fade-in');
    introScreenText.classList.remove('fade-out');
    return wait(2);
  })
  .then(() => {
    introScreenText.classList.add('fade-out');
    introScreenText.classList.remove('fade-in');
    return wait(2);
  })
  .then(() => {
    introScreenText.innerHTML =
      '<p class="welcome-statement">DO YOU HAVE WHAT IT TAKES TO BE A POKETRIVIA MASTER? LETS FIND OUT!</p>';
    introScreenText.classList.add('fade-in');
    introScreenText.classList.remove('fade-out');
  })
  .then(() => {
    introScreenText.classList.add('fade-out');
    introScreenText.classList.remove('fade-in');
    return wait(1);
  })
  .then(() => {
    introScreenText.innerHTML = introScreenFormHTML;
    introScreenText.classList.add('fade-in');
    introScreenText.classList.remove('fade-out');
  })
  .catch(err => {
    console.log(err.message);
  });

introScreen.addEventListener('click', function (e) {
  if (e.target.tagName === 'BUTTON') {
    const inputtedTag = document.querySelector('#trainer-tag');
    const inputtedName = document.querySelector('#intro-name-form');
    const inputtedIcon = document.querySelector('#trainer-icon');
    const inputtedRange = document.querySelector('#intro-screen-range');
    const inputtedQType = document.querySelector('#intro-question-type');
    playerTag = inputtedTag.value;
    playerName = inputtedName.value;
    userPokemonRange = inputtedRange.value;
    questionTypePreference = inputtedQType.value;
    profilePic.src = profilePic.dataset[inputtedIcon.value];
    console.log(profilePic.src);
    profile.innerHTML = ` ${playerTag} <br/> ${playerName}`;
    resetGame(
      'Welcome trainer! Please click on the start button on the top right corner to begin your game! Be sure to read the instructions in the sidebar before you play. You may change settings via the button in the sidebar on the right. Good luck! -Prof Oak'
    );
    wait(0)
      .then(() => {
        introScreenText.classList.add('fade-out');
        introScreenText.classList.remove('fade-in');
        return wait(2);
      })
      .then(() => {
        introScreenText.innerHTML = `<p class="welcome-statement"> You'll do great, ${playerName}. Go for the longest streak you can! The sky is the limit!`;
        introScreenText.classList.add('fade-in');
        introScreenText.classList.remove('fade-out');
        return wait(2);
      })
      .then(() => {
        introScreen.classList.add('fade-out');
        return wait(0.5);
      })
      .then(() => {
        introScreen.style.display = 'none';
        return wait(2);
      })
      .then(() => {
        gameContainer.classList.remove('display-none');
        aside.classList.remove('display-none');
        gameContainer.classList.add('fade-in');
        aside.classList.add('fade-in');
      })
      .catch(err => {
        console.log(err.message);
      });
  }
});

//-----CODE EXECUTION WITH THE INTRO SCREEN----------------

//TO DO:
// (1) Finish the timer, add the header to the intro screen! (Maybe add variables to local storage?), embed music?
// (2) Clean up code
// (3) Add comments at the appropriate spots
// (4) Save and store your images for your project in the images folder and re-route your photos accordingly!
// (5) Deploy your project (on Github!)
// (6) Turn in the project!
