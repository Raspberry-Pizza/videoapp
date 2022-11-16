# Details
Our goal was to make a really simple looking video call application with WebRTC. With this application the user has the ability to create a user and call other authenticated users from the dashboard view. The basic view displays users friends and the call link that creates a embedded dialog with the call view. User is able to make, reject and end a call. Other functionalities were left out from this project from the very start, due to strict schedule.
This application uses djangos local database and we have not set up a public server for this project.

# Copy and build the project
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

# How to use the application

1) Create a user from `localhost:8000/registration` (and friends user).

2) Log in the users on 2 different browser tabs from `localhost:8000/login`.

3) Now you can click the ***call*** link to call a friend.

4) To end a call click the ***end call*** button.

# Documentation

[Final report](https://github.com/Raspberry-Pizza/videoapp/blob/main/documents/Raspberry%20Pizza%20-%20Final%20Report%20-%20Networked%20Systems%20and%20Services.pdf)

# Authors

- Jakobson Joonas
- Laitinen Jaana
- Pandey Bivek
- Taguchi Akira
