'use strict';

//----SECTION 1: GLOBAL VARIABLES ----------------------------------------------------
//----------------------------------------------------------------------------
let globalPokemonData = [];
let pokemonNumIDArr = [];
let pokemonQuestionsArr = [];

//---SECTION 2A: CLASSES and OBJECTS ----------------------------------------------------------------------------

//BASE QUESTION CLASS------
class Question {
  constructor(pokeData) {
    this.pokeData = pokeData;
  }

  makeThreeRandomIndicesArray() {
    const randomIndicesArr = [];
    for (let i = 0; i < 3; i++) {
      let num = createRandomNumber(0, 14);
      while (randomIndicesArr.some(index => num === index)) {
        num = createRandomNumber(0, 14);
      }
      randomIndicesArr.push(num);
    }
    return randomIndicesArr;
  }

  createWrongAnswerPokeDataArray(pokeData) {
    return [...globalPokemonData].filter(data => data.name !== pokeData.name);
  }

  capitalizeString(string) {
    return string[0].toUpperCase() + string.slice(1);
  }

  createIncorrectAnswerArray(pokeData, answerFunction) {
    let incorrectAnswers = [];

    //prettier-ignore
    const wrongAnswerPokeDataArr = this.createWrongAnswerPokeDataArray(pokeData);

    const randomIndices = this.makeThreeRandomIndicesArray();
    randomIndices.forEach(index => {
      const incorrectAnswer = {
        isCorrect: false,
      };
      //prettier-ignore
      incorrectAnswer.answer = answerFunction(wrongAnswerPokeDataArr[index]);
      incorrectAnswers.push(incorrectAnswer);
    });
    return incorrectAnswers;
  }
}

//POKEMON PICTURE QUESTION SUBCLASS--------------
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
    };
    const incorrectAnswers = this.createIncorrectAnswerArray(
      pokeData,
      this.retrievePokemonName.bind(this)
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

//POKEMON TYPE QUESTION SUBCLASS------------------
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

  set answers(pokeData) {
    //local variables to be used later on
    const incorrectAnswerStringArr = [];
    let randomIndex1;
    let randomIndex2;

    //The for loop runs three times since three incorrect answers must be generated. The code below randomly decides whether the generated answer is of one or two types, and then randomly selects the types from the class' pokemonTypes array
    for (let i = 1; i <= 3; i++) {
      if (Math.random() <= 0.5) {
        //SCENARIO: answer will only of one type
        randomIndex1 = createRandomNumber(0, this.pokemonTypes.length); //randomIndex from 0-17
        incorrectAnswerStringArr.push(this.pokemonTypes[randomIndex1]); //An incorrect type will be chosen from this class's pokemonTypes array. This incorrect type is then pushed to an incorrectAnswers array
      } else {
        //SCENARIO: answer will be two types
        randomIndex1 = createRandomNumber(0, this.pokemonTypes.length);
        randomIndex2 = createRandomNumber(0, this.pokemonTypes.length);
        //prettier-ignore
        while (randomIndex1 === randomIndex2) 
        {
         //while loop ensures that the dual type won't be the same type (ex. ice ice or fire fire)
          randomIndex2 = createRandomNumber(0, this.pokemonTypes.length);
        }
        incorrectAnswerStringArr.push(
          //push the answer to the incorrectAnswers array
          `${this.pokemonTypes[randomIndex1]} ${this.pokemonTypes[randomIndex2]}`
        );
      }
    }

    //Step 2: derive the correct answer from the pokeData object
    const correctAnswer = pokeData.types.reduce((acc, slot, i) => {
      return (acc +=
        i === 0
          ? `${this.capitalizeString(slot.type.name)}`
          : `${this.capitalizeString(slot.type.name)}`);
    }, '');

    //combine the incorrect answers and the correct answer in a single array, then ensure that ALL DUPLICATE ANSWERS ARE TAKEN OUT! the duplicate answers will be replaced with alternate responses and the corrected array will be returned
    const fullResponseStringArr = this.correctForDuplicateAnswers([
      correctAnswer,
      ...incorrectAnswerStringArr,
    ]);

    //after you get the array of answers, then map those answers into answer objects
    this._answers = fullResponseStringArr.map(response => {
      return {
        isCorrect: response === correctAnswer,
        answer: response,
      };
    });
  }
}

//POKEMON ABILIITY QUESTION SUBCLASS-----------
class abilitiesQuestion extends Question {
  constructor(pokeData) {
    super(pokeData);
    this.questionPrompt = pokeData;
    this.answers = pokeData;
  }

  parsePokemonAbility(pokeData) {
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
      answer: this.parsePokemonAbility(pokeData),
    };

    const incorrectAnswers = this.createIncorrectAnswerArray(
      pokeData,
      this.parsePokemonAbility.bind(this)
    );

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

  parseBaseStats(pokeData) {
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
      answer: this.parseBaseStats(pokeData),
    };

    const incorrectAnswers = this.createIncorrectAnswerArray(
      pokeData,
      this.parseBaseStats.bind(this)
    );

    this._answers = [correctAnswer, ...incorrectAnswers];
  }
}

class heightAndWeightQuestion extends Question {
  constructor(pokeData) {
    super(pokeData);
    this.questionPrompt = pokeData;
    this.answers = pokeData;
  }
  parseHeightAndWeight(pokeData) {
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
      answer: this.parseHeightAndWeight(pokeData),
    };
    const incorrectAnswers = this.createIncorrectAnswerArray(
      pokeData,
      this.parseHeightAndWeight.bind(this)
    );

    this._answers = [correctAnswer, ...incorrectAnswers];
  }
}

//------SECTION 2B------------------------------------------------------------------
//----FUNCTIONS THAT SUPPORT THE CREATION AND IMPLEMENTATION OF QUESTION OBJECTS----
//----------------------------------------------------------------------------------

//still need to finish
function createQuestions(pokemonDataArr) {
  pokemonDataArr.forEach((data, i) => {
    if (i < 3) {
      const question = new pictureQuestion(1, 100, globalPokemonData[i]);
      question.questionPrompt = globalPokemonData[i];
      question.answers = globalPokemonData[i];
      pokemonQuestionsArr.push(question);
      console.log(pokemonQuestionsArr);
    }
  });
}

//------SECTION 3: ASYNC FUNCTIONS ----------------------------------------------
//----------------FOR FETCHING POKEDATA------------------------------------------

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
    //Promise.allSettled returns an array of all the fulfilled data (or unfufilled data) from the promiseArray above. Then the fulfilled values are mapped out and stored in pokemonDataValues
    const pokemonDataArr = await Promise.allSettled(promiseArray);
    const pokemonDataValues = pokemonDataArr.map(pokeData => pokeData.value);
    return pokemonDataValues;
  } catch {
    throw new Error(
      'Unable to fetch pokemon data... Please reload the page and try again.'
    );
  }
}

//-------------------OTHER FUNCTIONS -----------------------------------------
//----------------------------------------------------------------------------

function correctForDuplicateIDs(arr, min, max) {
  let set = new Set(arr);
  while (set.size < 15) {
    let num = createRandomNumber(min, max);
    set.add(num);
  }
  return [...set];
}

//sets the PokemonNumIDArr
function setPokemonNumIDArr(chosenRegion) {
  let min = 0;
  let max = 0;

  switch (chosenRegion) {
    case 'kanto':
      min = 1;
      max = 151;
      break;
    case 'johto':
      min = 152;
      max = 251;
      break;
    case 'hoenn':
      min = 252;
      max = 386;
      break;
    case 'sinnoh':
      min = 387;
      max = 493;
      break;
    default:
      min = 1;
      max = 809;
  }

  for (let i = 0; i <= 14; i++) {
    let num = createRandomNumber(min, max);
    pokemonNumIDArr.push(num);
  }

  pokemonNumIDArr = correctForDuplicateIDs(pokemonNumIDArr, min, max);
}

function createRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

//--------------------CODE EXECUTION AND TESTING------------------------------
//----------------------------------------------------------------------------
//test to see if the function above works for a single pokemon
// getSinglePokeData(2).then(res => console.log(res));

//test to see if the pokemonData is able to be set.
setPokemonNumIDArr();
console.log(pokemonNumIDArr);
makePokemonDataArray(pokemonNumIDArr)
  .then(pokemonDataValues => {
    globalPokemonData = [...pokemonDataValues];
    for (let i = 0; i < globalPokemonData.length; i++) {
      let question;
      if (i < 3) {
        question = new pictureQuestion(globalPokemonData[i]);
        pokemonQuestionsArr.push(question);
      } else if (i >= 3 && i < 6) {
        question = new typeQuestion(globalPokemonData[i]);
        pokemonQuestionsArr.push(question);
      } else if (i >= 6 && i < 9) {
        question = new abilitiesQuestion(globalPokemonData[i]);
        pokemonQuestionsArr.push(question);
      } else if (i >= 9 && i < 12) {
        question = new statsQuestion(globalPokemonData[i]);
        pokemonQuestionsArr.push(question);
      } else if (i >= 12 && i < 15) {
        question = new heightAndWeightQuestion(globalPokemonData[i]);
        pokemonQuestionsArr.push(question);
      }
    }
    console.log(pokemonQuestionsArr);
  })
  .catch(err => alert(err.message));

/* TO DO:
//figure out how to remove duplicates!
1) Create all global variables, classes, data needed for the game to properly run
2) Create the following functions:
    a) Function to reset the game
    b) Function to update the UI
    c) Function to render data into the divs WHEN the data is fetched. */
