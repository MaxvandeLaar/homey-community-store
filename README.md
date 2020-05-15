# Homey Community Store

The Homey Community store is a desktop (MacOS/Windows) app that brings the user and developer together! The Community Store provides an easy way for users to side-load apps while it allows access to almost every Homey app out there.

## How to install it
Just download your OS corresponding release here [https://github.com/MaxvandeLaar/homey-community-store/releases/latest](https://github.com/MaxvandeLaar/homey-community-store/releases/latest) and run the executable.

Please note that I did not sign the app as I am not willing to pay full price for Microsoft and Apple certificates so you might need to allow the app to run. It is definitely safe.

## How to get your app listed
Just create an issue or you can create a pull request and add your repo here [https://github.com/MaxvandeLaar/homey-community-store/blob/master/src/assets/apps.json](https://github.com/MaxvandeLaar/homey-community-store/blob/master/src/assets/apps.json). The app needs to conform to the same standards as official apps. As long as it runs and has the required files, it will be accepted. No matter if it's a duplicate or too complex app 😊  

### Development info

#### Develop
Just clone the repo and run `npm install`. Now you can use `npm start` to start the dev app. 

#### Building
So this is a bit of a pain and probably caused by some bad webpack config.

This all applies if you are working on MacOS Catalina (not yet configured for different development OS). 

##### MacOS

Just run `npm run make` and you are done.

##### Windows
First run `npm run make:win`. You will get an error with something like `Squirrel.Utility.CreateZipFromDirectory`... ignore this it was a success!

Now run `npm run build:win` and you are done. 
