#!/bin/bash

cd ..
cd webapp/style

lessc src/game.less game.css

lessc src/colors/game-against-blue.less colors/game-against-blue.css
lessc src/colors/game-against-red.less colors/game-against-red.css
lessc src/colors/game-against-green.less colors/game-against-green.css
lessc src/colors/game-against-yellow.less colors/game-against-yellow.css
lessc src/colors/game-against-orange.less colors/game-against-orange.css
lessc src/colors/game-against-blue-grey.less colors/game-against-blue-grey.css

lessc src/colors/game-for-blue.less colors/game-for-blue.css
lessc src/colors/game-for-red.less colors/game-for-red.css
lessc src/colors/game-for-green.less colors/game-for-green.css
lessc src/colors/game-for-yellow.less colors/game-for-yellow.css
lessc src/colors/game-for-orange.less colors/game-for-orange.css
lessc src/colors/game-for-blue-grey.less colors/game-for-blue-grey.css
