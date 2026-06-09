import { migrate, resetGame } from "./db.js";

migrate();
resetGame();
console.log("Game reset: users, runs, solves, team progress, and feed all cleared.");
