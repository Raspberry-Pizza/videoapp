# Details
Video call application made with WebRTC. Our application uses djangos local database and we have not set up a public server for this project.

## Build application
1) Install Python.

2) Copy repository:
`https://github.com/Raspberry-Pizza/videoapp.git`.

3) Install Dependencies:
`pip install -r requirements.txt`.

4) If you are running the application for very first time, run the following command:
`python manage.py migrate`. This will creates any necessary database tables for the project.

5) Run project:
`python manage.py runserver`.

6) Open `localhost:8000` in your browser.

## Use application

Create a user `localhost:8000`/registration` (and friends user).

Log in the users on 2 different browser tabs from `localhost:8000`/login`

Now you can click the "call" text to call a friend.
