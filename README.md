![Icon](iconTiny.png) fangamk
=============================

This is a way describe a type of game in json files, a javascipt engine to play
it and a pyqt application to make it.

Engine demo
----------

Use WASD to move and IJ to interact in this demo: https://ericoporto.github.io/builds/build00001/index.html

If you are in a computer, this demo is compatible with a Xbox360 gamepad, just
plug it in the usb port of your computer and you are good to go.

Maker
-----

![Screenshot](Maker/screenshot.png)

The editor is using Python 3 and Qt5.

You can get it here: https://github.com/ericoporto/fgmk

It will soon be packed as snap here: https://github.com/ericoporto/fgmkPackaging 

* old [Python 2.7 and PyQt4](Maker/Py2Qt4/README.md)
    * more tested, but being deprecated


Right now this code is using PyQt on the maker side, so assume everything here
is GPLv2.

Descriptors
-----------

The engine plays files that are basically json files and png images organized in
a certain folder structure. I am explaining this in the text right [here](Descriptor/README.md).
