'use strict';

//----SECTION 1: GLOBAL VARIABLES ----------------------------------------------------
//----------------------------------------------------------------------------
let globalPokemonData = [];
let pokemonNumIDArr = [];
let pokemonQuestionsArr = [];

//---SECTION 2A: CLASSES and OBJECTS --------------------------------------------------
//----------------------------------------------------------------------------

//BASE QUESTION CLASS
class Question {
  constructor(number, questionWorth, pokeData) {
    this.number = number;
    this.questionWorth = questionWorth;
    this.pokeData = pokeData;
  }
}

//PICTURE QUESTION SUBCLASS
class pictureQuestion extends Question {
  constructor(number, questionWorth, pokeData) {
    super(number, questionWorth, pokeData);
  }
  get answers() {
    return this._answers;
  }
  //the setter for the answers properties sets answers as an array of four objects with the properties answer (for the answer), and isCorrect (if the answer is correct)
  set answers(pokeData) {
    this._answers = [
      {
        answer: pokeData.name,
        isCorrect: true,
      },
    ];
    const incorrectPokeDataArr = [...globalPokemonData].filter(
      data => data.name !== pokeData.name
    );
    const randomIndices = makeThreeRandomIndicesArray(); //(refer to section 2B for this function)
    randomIndices.forEach(index => {
      const incorrectAnswerObj = {
        isCorrect: false,
      };
      incorrectAnswerObj.answer = incorrectPokeDataArr[index].name;
      this._answers.push(incorrectAnswerObj);
    });
  }
  get questionPrompt() {
    return this._questionPrompt;
  }
  set questionPrompt(pokeData) {
    this._questionPrompt =
      'What is the name of the pokemon presented in the image above?';
  }
}

//POKEMON TYPE QUESTION SUBCLASS
class typeQuestion extends Question {
  constructor(number, questionWorth, pokeData) {
    super(number, questionWorth, pokeData);
  }
  get answers() {
    return this._answers;
  }

  set answers(pokeData) {
    //answers will return an ARRAY that has four elements in there, each an object with two properties: answer, isCorrect
    //(1)Takes in data from a pokemon and stores the correct answer in one of the objects
    //(2)Utilizes data from the OTHER pokemon (or does whatever other data), and creates three FALSE answers with isCorrect property set to FALSE
  }

  get questionPrompt() {
    return this._questionPrompt;
  }

  set questionPrompt(pokeData) {
    //...
  }
}

//POKEMON ABILIITY QUESTION SUBCLASS
class abilitiesQuestion extends Question {
  constructor(number, questionWorth, pokeData) {
    super(number, questionWorth, pokeData);
  }
  get answers() {
    return this._answers;
  }

  set answers(pokeData) {
    //answers will return an ARRAY that has four elements in there, each an object with two properties: answer, isCorrect
    //(1)Takes in data from a pokemon and stores the correct answer in one of the objects
    //(2)Utilizes data from the OTHER pokemon (or does whatever other data), and creates three FALSE answers with isCorrect property set to FALSE
  }

  get questionPrompt() {
    return this._questionPrompt;
  }

  set questionPrompt(pokeData) {
    //...
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

function makeThreeRandomIndicesArray() {
  const randomIndicesArr = [];
  for (let i = 0; i < 3; i++) {
    let num = Math.floor(Math.random() * 14);
    randomIndicesArr.push(num);
  }
  return randomIndicesArr;
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
      'Unable to fetch pokemon data... Please reload the page and try again'
    );
  }
}

//creates a pokemon array to be used for the questions that will be displayed
async function makePokemonDataArray(pokemonIDarr) {
  try {
    //creates an array of promises. Each promise is obtained from the getSinglePokeData function, which fetches the data about a single pokemon. Exactly which pokemon it fetches data about is derived off each pokemonID in the passed pokemonIDarr
    const promiseArray = pokemonIDarr.map(async function (pokemonID) {
      return getSinglePokeData(pokemonID);
    });
    //Promise.allSettled returns an array of all the fulfilled data (or unfufilled data) from the promiseArray above. Then the fulfilled values are mapped out and stored in pokemonDataValues
    const pokemonDataArr = await Promise.allSettled(promiseArray);
    const pokemonDataValues = pokemonDataArr.map(pokeData => pokeData.value);
    return pokemonDataValues;
  } catch {
    throw new Error(
      'Unable to fetch pokemon data... Please reload the page and try again'
    );
  }
}

//-------------------OTHER FUNCTIONS -----------------------------------------
//----------------------------------------------------------------------------

function correctForDuplicatesIfAny(arr, min, max) {
  let set = new Set(arr);
  while (set.size < 15) {
    let num = Math.floor(Math.random() * (max - min) + min);
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
      min = 0;
      max = 809;
  }

  for (let i = 0; i <= 14; i++) {
    let num = Math.floor(Math.random() * (max - min) + min);
    pokemonNumIDArr.push(num);
  }

  pokemonNumIDArr = correctForDuplicatesIfAny(pokemonNumIDArr, min, max);
}

//--------------------CODE EXECUTION AND TESTING------------------------------
//----------------------------------------------------------------------------
//test to see if the function above works for a single pokemon
// getSinglePokeData(2).then(res => console.log(res));

//test to see if the pokemonData is able to be set.
setPokemonNumIDArr('johto');
console.log(pokemonNumIDArr);
makePokemonDataArray(pokemonNumIDArr).then(pokemonDataValues => {
  globalPokemonData = [...pokemonDataValues];
  console.log(globalPokemonData);
  const question1 = new pictureQuestion(1, 100, globalPokemonData[0]);
  question1.answers = globalPokemonData[0];
  question1.questionPrompt = globalPokemonData[0];
  console.log(question1);
});

/* TO DO:
//figure out how to remove duplicates!
1) Create all global variables, classes, data needed for the game to properly run
2) Create the following functions:
    a) Function to reset the game
    b) Function to update the UI
    c) Function to render data into the divs WHEN the data is fetched. */
