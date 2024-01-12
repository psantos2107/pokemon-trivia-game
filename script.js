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

  makeThreeRandomIndicesArray() {
    const randomIndicesArr = [];
    for (let i = 0; i < 3; i++) {
      let num = Math.floor(Math.random() * 14);
      randomIndicesArr.push(num);
    }
    return randomIndicesArr;
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
        isCorrect: true,
        answer: pokeData.name,
      },
    ];
    const incorrectPokeDataArr = [...globalPokemonData].filter(
      data => data.name !== pokeData.name
    );
    const randomIndices = this.makeThreeRandomIndicesArray(); //(refer to section 2B for this function)
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
  //prettier-ignore
  pokemonTypes = ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'];

  constructor(number, questionWorth, pokeData) {
    super(number, questionWorth, pokeData);
  }

  correctForDuplicateAnswers(arr) {
    let answerSet = new Set(arr);
    while (answerSet.size < 4) {
      let num = Math.floor(Math.random() * this.pokemonTypes.length);
      answerSet.add(this.pokemonTypes[num]);
    }
    return [...answerSet];
  }

  get questionPrompt() {
    return this._questionPrompt;
  }

  set questionPrompt(pokeData) {
    this._questionPrompt = `${
      pokeData.name[0].toUpperCase() + pokeData.name.slice(1)
    } is what type of Pokemon?`;
  }

  get answers() {
    return this._answers;
  }

  set answers(pokeData) {
    //local variables to be used later on
    const incorrectAnswerStringArr = [];
    let randomIndex1;
    let randomIndex2;

    //Step 1: Create all of the INCORRECT answers
    //Note the for loop will run three times, representing that we need three more incorrect answers
    for (let i = 1; i <= 3; i++) {
      //The Math.random() <= 0.5 if statement will determine randomly if the incorrect answer will be only of one type or two types (since pokemon can be either one or two types)
      if (Math.random() <= 0.5) {
        //the incorrect answer will only be of one type
        randomIndex1 = Math.floor(Math.random() * 18); //randomIndex from 0-17
        incorrectAnswerStringArr.push(this.pokemonTypes[randomIndex1]); //An incorrect type will be chosen from this class's pokemonTypes array. This incorrect type is then pushed to an incorrectAnswers array
      } else {
        //if Math.random() > 0.5, the incorrect answer will be of two types, requiring two separate  random indices
        randomIndex1 = Math.floor(Math.random() * 18);
        randomIndex2 = Math.floor(Math.random() * 18);
        //the while loop ensures that the two pokemon types chosen at random will be different (i.e. the typing won't be "normal normal" or "ice ice")
        //prettier-ignore
        while (this.pokemonTypes[randomIndex1] === this.pokemonTypes[randomIndex2] ) 
        {
          randomIndex2 = Math.floor(Math.random() * 18);
        }
        //push the answer to the incorrectAnswers array
        incorrectAnswerStringArr.push(
          `${this.pokemonTypes[randomIndex1]} ${this.pokemonTypes[randomIndex2]}`
        );
      }
    }

    //Step 2: derive the correct answer from the pokeData object
    const correctAnswer = pokeData.types.reduce((acc, slot, i) => {
      return (acc += i === 0 ? `${slot.type.name}` : ` ${slot.type.name}`);
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
    this._questionPrompt = `The pokemon ${
      pokeData.name[0].toUppercase() + pokeData.name.slice(1)
    }, presented above, is what of what type or combination of types?`;
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

function correctForDuplicateIDs(arr, min, max) {
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

  pokemonNumIDArr = correctForDuplicateIDs(pokemonNumIDArr, min, max);
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
  const question2 = new typeQuestion(2, 200, globalPokemonData[1]);
  question2.answers = globalPokemonData[1];
  question2.questionPrompt = globalPokemonData[1];
  console.log(question2);
});

/* TO DO:
//figure out how to remove duplicates!
1) Create all global variables, classes, data needed for the game to properly run
2) Create the following functions:
    a) Function to reset the game
    b) Function to update the UI
    c) Function to render data into the divs WHEN the data is fetched. */
