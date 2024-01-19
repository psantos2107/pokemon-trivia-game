'use strict';

//----SECTION 1: GLOBAL VARIABLES and query selectors ----------------------------------------------------
let globalPokeData = []; //will contain data for up to 30 different pokemon
let pokemonNumIDArr = []; //will contain the IDs of the pokemon that will be used to fetch data from pokeAPI
let pokemonQuestionsArr = []; //will contain questions to be used for the game
let currentQuestionNum = 0;

//---SECTION 2A: CLASSES and OBJECTS -------------------------------------------------

//BASE QUESTION CLASS------
class Question {
  constructor(pokeData) {
    this.pokeData = pokeData;
    this.answerIndex = shuffleArray([1, 2, 3, 4]);
  }

  makeThreeRandomIndicesArray() {
    const randomIndicesArr = [];
    for (let i = 0; i < 3; i++) {
      let num = createRandomNumber(0, 29);
      while (randomIndicesArr.some(index => num === index)) {
        num = createRandomNumber(0, 29);
      }
      randomIndicesArr.push(num);
    }
    return randomIndicesArr;
  }

  createWrongAnswerPokeDataArray(pokeData) {
    return [...globalPokeData].filter(data => data.name !== pokeData.name);
  }

  capitalizeString(string) {
    return string[0].toUpperCase() + string.slice(1);
  }

  createIncorrectAnswerArray(pokeData, retrieveFunction, ansIndex) {
    let incorrectAnswers = [];

    //produces an array of pokemon data to be used to derive wrong answers from
    //prettier-ignore
    const wrongAnswerPokeDataArr = this.createWrongAnswerPokeDataArray(pokeData);

    const randomIndices = this.makeThreeRandomIndicesArray(); //creates an array of three random numbers
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
    const correctAnswer = {
      isCorrect: true,
      answer: this.capitalizeString(pokeData.name),
      answerNumber: this.answerIndex[0],
    };
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
  //prettier-ignore
  pokemonTypes = ['Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'];

  constructor(pokeData) {
    super(pokeData);
    this.questionPrompt = pokeData;
    this.answers = pokeData;
  }

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

    //after you get the array of answers, then map those answers into answer objects. and store the resulting array of answer objects into this._answers
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

  set questionPrompt(pokeData) {
    this._questionPrompt = `Which of the following answers displays the correct base stats for the pokemon, ${this.capitalizeString(
      pokeData.name
    )}?`;
  }

  get answers() {
    return this._answers;
  }

  set answers(pokeData) {
    const correctAnswer = {
      isCorrect: true,
      answer: this.retrieveBaseStats(pokeData),
      answerNumber: this.answerIndex[0],
    };

    const incorrectAnswers = this.createIncorrectAnswerArray(
      pokeData,
      this.retrieveBaseStats.bind(this),
      [...this.answerIndex]
    );

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
    return data; //returns the data as the fulfillment value within a Promise
  } catch {
    throw new Error(
      'Unable to fetch pokemon data... Please reload the page and try again.'
    );
  }
}

//creates a pokemon array to be used for the questions that will be displayed
async function makePokemonDataArray(pokemonIDarr) {
  try {
    //creates an array of promises. Each promise is obtained from the getSinglePokeData function, which fetches the data about a single pokemon. Exactly which pokemon it fetches data about is derived off each pokemonID in the passed pokemonIDarr
    const promiseArray = pokemonIDarr.map(function (pokemonID) {
      return getSinglePokeData(pokemonID);
    });
    //Promise.allSettled returns an array of all the fulfilled data from the promiseArray above. Then the fulfilled values are mapped out and stored in pokemonDataValues as an array
    const globalPokeData = await Promise.allSettled(promiseArray);
    const pokemonDataValues = globalPokeData.map(pokeData => pokeData.value);
    return pokemonDataValues;
  } catch {
    throw new Error(
      'Unable to fetch pokemon data... Please reload the page and try again.'
    );
  }
}

const toggleAside = document.querySelector('.toggle-aside');
const aside = document.querySelector('aside');
const gamePromptContainer = document.querySelector('.game-prompt-container');
const gamePrompt = document.querySelector('.game-prompt');
const answerContainer = document.querySelector('.answer-container');
const questionBox = document.querySelector('.question');
const bottomSection = document.querySelector('.bottom-section');
const lifelines = document.querySelector('.lifelines-container');

//--------FUNCTIONS THAT HELP CREATE THE POKEMON ID ARRAY THAT WILL BE PASSED INTO THE ASYNC FUNCTIONS FOR FETCHING POKEMON DATA --------------------------
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
}

//------------ FUNCTION THAT SETS THE POKEMON QUESTIONS ARRAY -----------------------
function setPokemonQuestionsArr() {
  for (let i = 0; i < 15; i++) {
    let question;
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
  console.log(pokemonQuestionsArr);
}

function shuffleArray(arr) {
  let shuffledArr = [...arr];
  for (let i = 0; i < shuffledArr.length; i++) {
    const j = Math.floor(Math.random() * shuffledArr.length);
    [shuffledArr[i], shuffledArr[j]] = [shuffledArr[j], shuffledArr[i]];
  }
  return shuffledArr;
}

function insertButton(buttonText, buttonClass) {
  questionBox.insertAdjacentHTML(
    'afterend',
    `<button
  style="display: block; width: fit-content; margin: auto; padding-left: 5px; padding-right 5px; font-size: 1.1rem; margin-top: 5px;" class = "inserted-button ${buttonClass}"
>${buttonText}</button>`
  );
}

//--------------------CODE EXECUTION AND TESTING------------------------------
setPokemonNumIDArr('all');
console.log(pokemonNumIDArr);
makePokemonDataArray(pokemonNumIDArr)
  .then(pokemonDataValues => {
    globalPokeData = [...pokemonDataValues];
    setPokemonQuestionsArr();
    setTimeout(() => {
      gamePrompt.textContent = 'QUESTIONS LOADED! CLICK THE BUTTON TO PLAY!';
    }, 300);
  })
  .catch(() =>
    alert(
      'Error with fetching Pokemon data. Please re-load the page or press the "reset game" button and try again.'
    )
  );

//Start button = Next Question VS play again!
/* TASKS: 
    (1) Render the question onto the page
      (a) Place the question in the question box:
      (b) Place the level in the level box
      (c) Change text content in the answer boxes
        (c1): randomize an array with numbers 1-4
        (c2): based on the array, assign the text content to each */

/* TO DO:
//figure out how to remove duplicates!
1) Create all global variables, classes, data needed for the game to properly run
2) Create the following functions:
    a) Function to reset the game
    b) Function to update the UI
    c) Function to render data into the divs WHEN the data is fetched. */

//toggle button
toggleAside.addEventListener('click', function () {
  aside.classList.toggle('translate-away');
  setTimeout(() => {
    aside.classList.toggle('hide-element');
  }, 350);
});

gamePromptContainer.addEventListener('click', function (e) {
  if (e.target.tagName === 'BUTTON') {
    lifelines.classList.toggle('disable-button');
    renderQuestionAndAnswers();
    // const displayQLevel = document.querySelector('.display-question-level');
    // const currentPokeQuestion = pokemonQuestionsArr[currentQuestionNum];
    // const previousLvl = document.querySelector(`.lvl${currentQuestionNum}`);
    // const currentLvl = document.querySelector(`.lvl${currentQuestionNum + 1}`);
    // const answerArr = currentPokeQuestion.answers;
    // const pokeImage = document.querySelector('.pokemon-image');

    // pokeImage.src = currentPokeQuestion.pokeData.sprites.front_default;
    // displayQLevel.textContent = `LVL ${currentLvl.textContent}`;
    // if (previousLvl) {
    //   previousLvl.classList.toggle('current-level');
    // }
    // currentLvl.classList.toggle('current-level');
    // questionBox.textContent = currentPokeQuestion.questionPrompt;
    // answerArr.forEach(answerObj => {
    //   const answerBox = document.querySelector(`.ans${answerObj.answerNumber}`);
    //   answerBox.textContent += ` ${answerObj.answer}`;
    // });
    // gamePromptContainer.classList.add('disable-button');
    // answerContainer.classList.toggle('disable-button');
  }
});

answerContainer.addEventListener('click', function (e) {
  const currentPokeQuestion = pokemonQuestionsArr[currentQuestionNum - 1];
  if (e.target.tagName === 'BUTTON') {
    const chosenAnswerObj = currentPokeQuestion.answers.find(answer => {
      return parseInt(e.target.dataset.num) === answer.answerNumber;
    });
    const correctAnswerObj = currentPokeQuestion.answers.find(
      answer => answer.isCorrect
    );

    //backgroundColor is yellow to notify that the person chose the answer....
    e.target.style.backgroundColor = '#FFF9C4';

    //setTimeOut for dramatic effect
    setTimeout(() => {
      if (chosenAnswerObj.isCorrect) {
        e.target.style.backgroundColor = 'green';
        questionBox.textContent = 'CORRECT!! YOU GOT THIS!';
        insertButton('Next Question?', 'next-question');
      } else {
        e.target.style.backgroundColor = '#FF0000';
        document.querySelector(
          `.ans${correctAnswerObj.answerNumber}`
        ).style.backgroundColor = '#4CAF50';
        questionBox.textContent =
          'INCORRECT! Sorry about that, trainer... Press "Play Again" to play with different questions!';
        insertButton('Play Again?', 'play-again');
      }
    }, 1000);
    this.classList.toggle('disable-button');
  }
});

bottomSection.addEventListener('click', function (e) {
  if (e.target.classList.contains('next-question')) {
    const insertedButton = document.querySelector('.inserted-button');
    const answerBoxes = document.querySelectorAll('.answer');
    insertedButton.remove();
    answerBoxes.forEach(
      answerBox =>
        (answerBox.style.backgroundColor = 'var(--off-white-block-background)')
    );
    renderQuestionAndAnswers();
  }
});

function renderQuestionAndAnswers() {
  currentQuestionNum++; // =2
  const displayQLevel = document.querySelector('.display-question-level');
  const currentPokeQuestion = pokemonQuestionsArr[currentQuestionNum - 1]; //index1
  const previousLvl = document.querySelector(`.lvl${currentQuestionNum - 1}`); //level1
  const currentLvl = document.querySelector(`.lvl${currentQuestionNum}`); //level2
  const answerArr = currentPokeQuestion.answers;
  const pokeImage = document.querySelector('.pokemon-image');

  pokeImage.src = currentPokeQuestion.pokeData.sprites.front_default;
  displayQLevel.textContent = `LVL ${currentLvl.textContent}`;
  if (previousLvl) {
    previousLvl.classList.toggle('current-level');
  }
  currentLvl.classList.toggle('current-level'); //currentLvl = level 1
  questionBox.textContent = currentPokeQuestion.questionPrompt;
  answerArr.forEach(answerObj => {
    const answerBox = document.querySelector(`.ans${answerObj.answerNumber}`);
    answerBox.textContent = answerObj.answer;
  });
  gamePromptContainer.classList.add('disable-button');
  answerContainer.classList.toggle('disable-button');
}
