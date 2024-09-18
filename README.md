# Pokemon-Trivia-Game

![Intro Screen with Professor Oak](./imgs/ProfOakGameScreenshot.png 'Professor Oak introduction screen')

![Trivia Game snapshot](./imgs/TriviaGameScreenshot.png 'Trivia Game Snapshot')

![Settings snapshot](./imgs/settingScreenshot.png 'Settings snapshot')

## Description

NOTE: The current game design is primarily meant only for the browser (will work on mobile-friendly design at a later time.)

The project is a trivia game comprised of 15 questions, testing players about their knowledge of Pokemon. Players will be able to decide what type of questions they want to be tested on and what Pokemon they want to be tested on. They will also be able to input their name, input their trainer tags, choose their profile picture icon, and background color for further customizability. Questions will always be different, allowing players to be constantly challenged on their knowledge on Pokemon no matter how many times they play!

Inside the game, players will have access to two lifelines: 50/50 and change the question, which can assist players in case they get stuck on a question. Players will have freedom to reset the game whenever they want and change the settings of the game at any time of their choosing. Players will also have access to an instructions pop-up box in case they would like details on how the game works.

Players will also be greeted by Professor Oak when the game launches, allowing for a nostalgic experience as Professor Oak "welcomes" you to the world of Pokemon trivia!

## Technologies Used

Javascript, HTML, CSS

## Approach Taken

The project was done primarily with an Object Oriented Programming approach, making use of the [PokeAPI](https://pokeapi.co/) to obtain data about various Pokemon as well as classes to provide the structure for various types of questions.

## Live Site Link

Link: https://psantos2107.github.io/pokemon-trivia-game/

## Installation Instructions

To utilize the code for this project, simply clone this repository and open the index.html file. No additional packages are needed for installation.

## Challenges and Problems

_Limitations/Hurdles_

- **Project Responsiveness**: The current project is only meant for the browser. Implementations for the application to be mobile friendly was not considered for this project. However, work to make the project more responsive will be worked on later on.

- **CSS Code**: I particularly struggled a lot with how to organize my CSS code so that it is easy to follow if people decide to clone the project. Also, I was having trouble with making sure that my project fit the viewport so that players wouldn't have to scroll. Writing efficient CSS and avoiding redundant CSS was also a major hurdle.

- **"This" Keyword**: There were some problems regarding what "this" was referencing to at different points in the project, especially when passing functions to other functions, resulting in some bugs throughout development. It was resolved by using "bind()" to attach a specific object to the "this" keyword when passing functions into other functions within the question subclasses.

- **Fetching and Storing Pokemon Data from API**: Extensive research was done to figure out how to draw data from the PokeAPI and do it efficiently to use for the Pokemon questions. Eventually, use of fetch() and Promise.allSettled() were implemented in order to successfully accomplish this goal.

## Plans for Future Expansion/ Further Stretch Goals:

-Utilize localStorage so that the user won't have to encounter the intro screen at every re-load of the page.

-Add more features (more profile pictures, more question types, more "achievements", more versatility with settings)

-Create a mobile friendly layout that will adapt to phone screens

## License:

Distributed under the MIT License. See [LICENSE.md] for more information.

## Contact:

-Name: Paul Santos

-Email: paul.santos2107@gmail.com

-LinkedIn: https://www.linkedin.com/in/paul-santos-502312257/

## References:

-[PokeAPI](https://pokeapi.co/): for info on the API where Pokemon data was drawn from

-[Pokemon Hollow Font](https://www.cdnfonts.com/pokemon-hollow.font): link to where the Pokemon Hollow Font was drawn from

-[Font Awesome](https://fontawesome.com/): link where all icons in the game were drawn from.

-[Confetti](https://www.skypack.dev/view/canvas-confetti): link to documentation of the confetti function, from which the confetti animation was imported

-[Gloria Hallelujah Font](https://fonts.google.com/specimen/Gloria+Hallelujah): link to the Gloria Hallelujah Font, which is the primary font style used throughout the project.

-[Div Border Stylings](https://speckyboy.com/css-border-effects/)- link to the site where the curvy border stylings were drawn from. Refer to the "A Hand Drawn Look" section of the page for reference.
