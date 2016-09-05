# The pucklab application

Visual summaries of NHL games.

## Structure

### Data

Found in db/scrapping.

Python tools to download, scrape and load NHL game information into MongoDB.

### Web Backend

Backend is a Python Flask webserver using  MongoDB for the data. The python code is in webapp/src.

Jinja2 is used for templating. All the templates are found in webapp/templates.

### Web Frontend

Bootstrap is used for layout when possible.

Any custom styles are done using less. The source for the style is in webapp/styles/src. Once compiled the .css sheets will be in webapp/styles.

Jquery is used to help with javascript.

D3.js is used for visualizations.

## Features

- Navigate to /<season>/<team>/<gameNumber> and a visual summary of that game will be displayed using data from the database, and d3.js.

## To-Do

A lot!

- Be able to navigate to different games using search.
- And penalty information.
- Add more stats to game summary.

And much more...
