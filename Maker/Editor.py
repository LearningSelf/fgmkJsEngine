#!/usr/bin/env python
# display a tiled image from tileset with PyQt
import os
import sys
import json
import TileXtra
from PIL import Image
from PIL.ImageQt import ImageQt
from PyQt4.QtGui import *
from PyQt4.QtCore import *
from PyQt4 import QtGui, QtCore
import actionDialog
import TXWdgt

sSettings = { "gamefolder": "Game/" }

COLISIONLAYER = 3
EVENTSLAYER = 4

leftClickTool = 0
rightClickTool = 1 

firstClickX = None
firstClickY = None

def changeTileCurrent( changeTo ):
    m.myMapWidget.currentTile = changeTo
    m.myPaletteWidget.setImageCurrent(changeTo)

def changeLayerCurrent( changeTo ):
    m.myMapWidget.currentLayer = changeTo


class MapWidget(QWidget):
    def __init__(self, parent=None, **kwargs):
        QWidget.__init__(self, parent, **kwargs)

        self.Grid = QGridLayout(self)

        self.Grid.setHorizontalSpacing(0)
        self.Grid.setVerticalSpacing(0)
        self.Grid.setSpacing(0)
        self.Grid.setContentsMargins(0, 0, 0, 0)

        self.parent = parent

        self.TileWidth = 0
        self.TileHeight = 0
        self.myScale = 2
        self.currentTile = 5
        self.currentLayer = 0

        self.currentEvent = 1
        self.currentColision = 1

        self.TileList = []

        self.DrawMap(parent)

    def DrawMap(self, parent):

        #self.setUpdatesEnabled(False)
        self.setVisible(False)
        LayersMapTiles = parent.myMap.LayersMapTiles

        self.TileHeight = len(LayersMapTiles[0])
        self.TileWidth = len(LayersMapTiles[0][0])

        #print(LayersMapTiles)

        if len(self.TileList) > 1:
            for collum in self.TileList:
                for wdgt in collum:
                    wdgt.deleteLater()
                    wdgt = None
            self.TileList = []
            
        # get the background numbers and use to get the tiles
        # for i in height    
        for iy in xrange(self.TileHeight):
            # for j in width
            self.TileList.append([])
            for jx in range(self.TileWidth):
                
                self.TileList[iy].append(TileXtra.ExtendedQLabel(self))
                self.Grid.addWidget(self.TileList[iy][jx], iy, jx)
                self.TileList[iy][jx].initTile( parent.myTileSet.tileset, jx , iy, parent.myTileSet.boxsize, LayersMapTiles[:,iy,jx], self.myScale)
                self.connect(self.TileList[iy][jx], SIGNAL('clicked()'), self.TileInMapClicked)
                self.connect(self.TileList[iy][jx], SIGNAL('scroll(int)'), self.wheelScrolledTileInMap)
                self.connect(self.TileList[iy][jx], SIGNAL('rightClicked()'), self.TileInMapRightClicked)
                

        self.resize(self.TileWidth*parent.myTileSet.boxsize*self.myScale,self.TileHeight*parent.myTileSet.boxsize*self.myScale)
        #self.setUpdatesEnabled(True)
        self.setVisible(True)
        #self.show()

    def TileInMapRightClicked(self):
        global rightClickTool
        self.ClickedATileinMap(rightClickTool)

    def TileInMapClicked(self):
        global leftClickTool 
        self.ClickedATileinMap(leftClickTool)

    def ClickedATileinMap(self, theClickedTool):
        global firstClickX
        global firstClickY

        if theClickedTool == 0:
        #pen
            if(self.currentLayer == COLISIONLAYER):
                self.changeTileType(self.currentColision)
            elif(self.currentLayer == EVENTSLAYER):
                self.changeTileType(self.currentEvent)
                self.parent.myEventsWidget.updateEventsList()
            else:
                self.changeTileType(self.currentTile)

        elif theClickedTool == 1: 
        #dropper
            if(self.currentLayer == COLISIONLAYER):
                self.currentColision = self.sender().tileType[COLISIONLAYER]
            elif(self.currentLayer == EVENTSLAYER):
                self.currentEvent = self.sender().tileType[EVENTSLAYER]
                self.parent.myEventsWidget.updateEventsList()
            else:
                changeTileCurrent(self.sender().tileType[self.currentLayer])

        elif theClickedTool == 2: 
        #bucket
            if(self.currentLayer == COLISIONLAYER):
                self.toolBucketFill(self.currentColision)
            elif(self.currentLayer == EVENTSLAYER):
                self.toolBucketFill(self.currentEvent)
                self.parent.myEventsWidget.updateEventsList()
            else:
                self.toolBucketFill(self.currentTile)
    
        if theClickedTool == 3: 
        #line
            if firstClickX is None:
                firstClickX = self.sender().tileX
                firstClickY = self.sender().tileY
            else:
                if(self.currentLayer == COLISIONLAYER):
                    self.toolLine(self.currentColision, firstClickX, firstClickY)
                elif(self.currentLayer == EVENTSLAYER):
                    self.toolLine(self.currentEvent, firstClickX, firstClickY)
                    self.parent.myEventsWidget.updateEventsList()
                else:
                    self.toolLine(self.currentTile, firstClickX, firstClickY)
                firstClickX = None
                firstClickY = None
        elif theClickedTool == 4: 
        #rectangle
            if firstClickX is None:
                firstClickX = self.sender().tileX
                firstClickY = self.sender().tileY
            else:
                if(self.currentLayer == COLISIONLAYER):
                    self.toolRect(self.currentColision, firstClickX, firstClickY)
                elif(self.currentLayer == EVENTSLAYER):
                    self.toolRect(self.currentEvent, firstClickX, firstClickY)
                    self.parent.myEventsWidget.updateEventsList()
                else:
                    self.toolRect(self.currentTile, firstClickX, firstClickY)
                firstClickX = None
                firstClickY = None
        else:
                firstClickX = None
                firstClickY = None

    def wheelScrolledTileInMap(self, scrollAmount):
        scrollAmount /= abs(scrollAmount)
        if(self.currentLayer == COLISIONLAYER):
            if self.sender().tileType[COLISIONLAYER] == 0:
                changeTypeTo = 1
            elif self.sender().tileType[COLISIONLAYER] == 1:
                changeTypeTo = 0
            else:
                changeTypeTo = 0
            self.currentColision = changeTypeTo
        elif(self.currentLayer == EVENTSLAYER):
            if abs(self.sender().tileType[EVENTSLAYER] + scrollAmount) < 120:
                changeTypeTo = abs(self.sender().tileType[EVENTSLAYER] + scrollAmount)
            else:
                changeTypeTo = abs(self.sender().tileType[EVENTSLAYER] + scrollAmount -2)
            self.currentEvent = changeTypeTo    
        else:
            if abs(self.sender().tileType[self.currentLayer] + scrollAmount) < len(self.parent.myTileSet.tileset):
                changeTypeTo = abs(self.sender().tileType[self.currentLayer] + scrollAmount)
            else:
                changeTypeTo = abs(self.sender().tileType[self.currentLayer] + scrollAmount -2)
            changeTileCurrent( changeTypeTo )
        self.changeTileType(changeTypeTo)
        if(self.currentLayer == EVENTSLAYER):
            self.parent.myEventsWidget.updateEventsList()

    def changeTileType(self, changeTypeTo):
        command = TXWdgt.CommandCTTileType(self.parent, self.sender(), self.parent.myMap, self.parent.myTileSet.tileset, self.currentLayer, changeTypeTo, "change tile")
        self.parent.undoStack.push(command)


    def toolBucketFill(self, changeTypeTo):
        listToChange = TileXtra.tileFill(self.sender().tileX, self.sender().tileY, self.parent.myMap.LayersMapTiles[self.currentLayer], changeTypeTo)
        command = TXWdgt.CommandCGroupTType(self.parent, self.sender(), self.parent.myMap, self.parent.myTileSet.tileset, self.currentLayer, changeTypeTo, listToChange, "bucket fill")
        self.parent.undoStack.push(command)


    def toolLine(self, changeTypeTo, firstX, firstY):
        listToChange = TileXtra.tileLine(firstX, firstY, self.sender().tileX, self.sender().tileY, self.parent.myMap.LayersMapTiles[self.currentLayer], changeTypeTo)
        command = TXWdgt.CommandCGroupTType(self.parent, self.sender(), self.parent.myMap, self.parent.myTileSet.tileset, self.currentLayer, changeTypeTo, listToChange, "line")
        self.parent.undoStack.push(command)


    def toolRect(self, changeTypeTo, firstX, firstY):
        listToChange = TileXtra.tileRect(firstX, firstY, self.sender().tileX, self.sender().tileY, self.parent.myMap.LayersMapTiles[self.currentLayer], changeTypeTo)
        command = TXWdgt.CommandCGroupTType(self.parent, self.sender(), self.parent.myMap, self.parent.myTileSet.tileset, self.currentLayer, changeTypeTo, listToChange, "rectangle")
        self.parent.undoStack.push(command)


class ToolsWidget(QWidget):
    def __init__(self, parent=None, **kwargs):
        QWidget.__init__(self, parent, **kwargs)

        self.scale = 2

        self.toolTileset = TileXtra.TileSet( TileXtra.COREIMGFOLDER + "tools.png" )

        self.VBox = QVBoxLayout(self)
        self.VBox.setAlignment(Qt.AlignTop)

        TOOLSTARTINGTILE = 6
        ToolsName = ["pen", "dropper", "bucket", "line","rectangle"]
        ToolsHelp = ["click to change tile to selected tile", 
                     "click to get tile type and set to selected tile", 
                     "click to fill area with selected tile", 
                     "click once to set starting point and again to set ending point",
                     "click once to set first corner and again to set opposing corner"]
        self.MaxTools = len(ToolsName)
        self.ToolTile = []
        
        for i in range(self.MaxTools):
            self.ToolTile.append(TileXtra.ExtendedQLabel(self))
            self.ToolTile[-1].initTile( self.toolTileset.tileset, 0, 0, self.toolTileset.boxsize, [0,0,TOOLSTARTINGTILE+i,0,0], self.scale)
            self.ToolTile[-1].setObjectName(ToolsName[i])
            self.ToolTile[-1].setToolTip(ToolsName[i]+"\nWhen selected, "+ToolsHelp[i])
            self.connect(self.ToolTile[-1], SIGNAL('clicked()'), self.toolLeftClicked)
            self.connect(self.ToolTile[-1], SIGNAL('rightClicked()'), self.toolRightClicked)
            self.VBox.addWidget(self.ToolTile[-1])

        self.updateToolTiles()
        self.show()

    def toolLeftClicked(self):
        global leftClickTool 

        if str(self.sender().objectName()) == "pen":
            leftClickTool = 0
        elif str(self.sender().objectName())  == "dropper":
            leftClickTool = 1
        elif str(self.sender().objectName())  == "bucket":
            leftClickTool = 2
        elif str(self.sender().objectName())  == "line":
            leftClickTool = 3
        elif str(self.sender().objectName())  == "rectangle":
            leftClickTool = 4
 
        self.updateToolTiles()
        self.show()

    def toolRightClicked(self):
        global rightClickTool

        if str(self.sender().objectName()) == "pen":
            rightClickTool = 0
        elif str(self.sender().objectName())  == "dropper":
            rightClickTool = 1
        elif str(self.sender().objectName())  == "bucket":
            rightClickTool = 2
        elif str(self.sender().objectName())  == "line":
            rightClickTool = 3
        elif str(self.sender().objectName())  == "rectangle":
            rightClickTool = 4

        self.updateToolTiles()
        self.show()

    def updateToolTiles(self):
        global leftClickTool 
        global rightClickTool

        LEFTCLICKTILE = 1
        LEFTCLICKLAYER = 1
        RIGHTCLICKTILE = 2
        RIGHTCLICKLAYER = 0

        for i in range(self.MaxTools):
            if i == leftClickTool:
                self.ToolTile[i].updateTileImageInMap(LEFTCLICKTILE, LEFTCLICKLAYER, self.toolTileset.tileset , self.scale)
            else:
                self.ToolTile[i].updateTileImageInMap(0, LEFTCLICKLAYER, self.toolTileset.tileset , self.scale)
            if i == rightClickTool:
                self.ToolTile[i].updateTileImageInMap(RIGHTCLICKTILE, RIGHTCLICKLAYER, self.toolTileset.tileset, self.scale)
            else:
                self.ToolTile[i].updateTileImageInMap(0, RIGHTCLICKLAYER, self.toolTileset.tileset , self.scale)
    

class EventsWidget(QWidget):
    def __init__(self,pMap, parent=None, **kwargs):
        QWidget.__init__(self, parent, **kwargs)
        global sSettings

        self.parent = parent

        self.HBox = QHBoxLayout(self)
        self.HBox.setAlignment(Qt.AlignTop)

        self.labelEventsList = QLabel("List of Events:")
        self.EventsList = QListWidget(self)

        self.labelActionList = QLabel("List of Actions:")
        self.ActionList = QListWidget(self)

        VBoxEventsList = QVBoxLayout()
        VBoxActionList = QVBoxLayout() 
        VBoxButtons = QVBoxLayout()

        self.addActionButton = QPushButton("Add Action", self)
        self.editActionButton = QPushButton("Edit Action", self)
        self.removeActionButton = QPushButton("Remove Action", self)
        self.deselectActionButton = QPushButton("Deselect Actions", self)

        self.checkboxes = []
        self.checkboxes.append(QCheckBox("on click", self))
        self.checkboxes.append(QCheckBox("on over", self))

        self.addActionButton.clicked.connect(self.addAction)
        self.editActionButton.clicked.connect(self.editAction)
        self.removeActionButton.clicked.connect(self.removeAction)
        self.deselectActionButton.clicked.connect(self.deselectAction)

        self.HBox.addLayout(VBoxEventsList)
        self.HBox.addLayout(VBoxActionList)
        self.HBox.addLayout(VBoxButtons)

        VBoxEventsList.addWidget(self.labelEventsList)
        VBoxEventsList.addWidget(self.EventsList)

        VBoxActionList.addWidget(self.labelActionList)
        VBoxActionList.addWidget(self.ActionList)

        VBoxButtons.addWidget(self.addActionButton)
        VBoxButtons.addWidget(self.editActionButton)
        VBoxButtons.addWidget(self.removeActionButton)
        VBoxButtons.addWidget(self.deselectActionButton)

        self.checkboxes[0].setCheckState(Qt.Checked)
        self.checkboxes[1].setCheckState(Qt.Unchecked)

        for checkbox in self.checkboxes:
            VBoxButtons.addWidget(checkbox)
            checkbox.stateChanged.connect(self.checkboxesChanged)

        self.EventsList.itemSelectionChanged.connect(self.enableButtonsBecauseEventsList)
        self.ActionList.itemSelectionChanged.connect(self.enableButtonsBecauseActionList)
#        self.EventsList.itemClicked.connect(self.selectedItemFromEventsList)
        self.EventsList.itemSelectionChanged.connect(self.selectedItemFromEventsList)

        self.addActionButton.setEnabled(False)
        self.removeActionButton.setEnabled(False)
        self.ActionList.setEnabled(False)
        self.labelActionList.setEnabled(False)
        self.deselectActionButton.setEnabled(False)
        self.editActionButton.setEnabled(False)

        self.show()

        self.pMap = pMap

    def editAction(self):

        if self.EventsList.selectedItems() is not None: 
            indexOfAction = self.ActionList.row(self.ActionList.selectedItems()[0])
            actionParamToEdit = self.pMap.getActionOnEvent(indexOfAction,self.EventsList.selectedItems()[0].whatsThis())

            actionToEdit = actionParamToEdit.split('|')[0]
            paramOfEdit = actionParamToEdit.split('|')[1]

            paramArrayOfEdit = paramOfEdit.split(';')

            newDialogFromName = getattr(actionDialog, str(actionToEdit))

            self.myActionsDialog = newDialogFromName(sSettings["gamefolder"],self,paramArrayOfEdit)
            if self.myActionsDialog.exec_() == QtGui.QDialog.Accepted:
                returnActDlg = str(self.myActionsDialog.getValue())

                actionToAdd = actionToEdit+'|'+str(returnActDlg)

                self.ActionList.takeItem(indexOfAction)
                self.ActionList.insertItem(indexOfAction,actionToAdd)
                self.pMap.changeActionOnEvent(indexOfAction,actionToAdd,self.EventsList.selectedItems()[0].whatsThis())                             

    def deselectAction(self):
        for i in range(self.ActionList.count()):
            item = self.ActionList.item(i)
            self.ActionList.setItemSelected(item, False)

    def checkboxesChanged(self, newState):
        if self.EventsList.selectedItems() is not None: 
            checkboxesStates = []
            for checkbox in self.checkboxes:
                checkboxesStates.append(int(checkbox.isChecked()))
            
            self.pMap.setEventType(str(self.EventsList.selectedItems()[0].whatsThis()),
                                   [int(self.checkboxes[0].isChecked()),
                                   int(self.checkboxes[1].isChecked())
                                   ])

    def updateEventsList(self):

        updatedListOfEvents = self.pMap.getTileListFromLayer(EVENTSLAYER)
        allItemsInEventsList = []
        for index in xrange(self.EventsList.count()):
            allItemsInEventsList.append([self.EventsList.item(index), index])

        for item in allItemsInEventsList:
            for event in updatedListOfEvents[:]:
                if (item[0].whatsThis() == str(event)) :
                    updatedListOfEvents.remove(event)
                    break
            else:
                settonone = self.EventsList.takeItem(item[1])
                settonone = None

        if updatedListOfEvents is not None:
            for event in updatedListOfEvents:
                item = QListWidgetItem("Event %03d" % event)
                item.setWhatsThis("%d" % event)
                self.EventsList.addItem(item)

        self.EventsList.sortItems()

        self.show()

    def addAction(self):
        global sSettings

        self.myActionsWidget = TXWdgt.ActionsWidget(sSettings,self)
        if self.myActionsWidget.exec_() == QtGui.QDialog.Accepted:
            actionToAdd = str(self.myActionsWidget.getValue())
        
            if self.EventsList.selectedItems() is not None:  
                if not self.ActionList.selectedItems():      
                    self.ActionList.addItem(actionToAdd)
                    self.pMap.addActionToEvent(actionToAdd,self.EventsList.selectedItems()[0].whatsThis())
                else:
                    indexOfAction = self.ActionList.row(self.ActionList.selectedItems()[0])
                    self.ActionList.insertItem(indexOfAction,actionToAdd)
                    self.pMap.insertActionToEvent(indexOfAction,actionToAdd,self.EventsList.selectedItems()[0].whatsThis())

    def removeAction(self):

        for item in self.ActionList.selectedItems():
            self.ActionList.takeItem(self.ActionList.row(item))
            self.pMap.removeActionByIndexOnEvent(self.ActionList.row(item),self.EventsList.selectedItems()[0].whatsThis())

    def selectedItemFromEventsList(self):
        item = self.EventsList.selectedItems()[0]

        self.ActionList.clear()    

        for actionItem in self.pMap.getActionListOnEvent(item.whatsThis()):
            self.ActionList.addItem(actionItem)

        state = self.pMap.getEventType(item.whatsThis())
        
        for i in range(len(self.checkboxes)):
            self.checkboxes[i].setCheckState(2*state[i])
            self.checkboxes[i].show()

        self.ActionList.show()


    def enableButtonsBecauseEventsList(self):
        if (self.EventsList.currentItem().isSelected() == True):
            self.addActionButton.setEnabled(True)
            self.ActionList.setEnabled(True)
            self.labelActionList.setEnabled(True)
        else:
            self.addActionButton.setEnabled(False)
            self.removeActionButton.setEnabled(False)
            self.ActionList.setEnabled(False)
            self.labelActionList.setEnabled(False)
            self.deselectActionButton.setEnabled(False)
            self.editActionButton.setEnabled(False)

    def enableButtonsBecauseActionList(self):
        enable = True
        if (self.ActionList.currentItem() is None):
            enable = False
        else:
            if (self.ActionList.currentItem().isSelected() == False):
                enable = False

        if (enable):
            self.removeActionButton.setEnabled(True)       
            self.deselectActionButton.setEnabled(True)   
            self.editActionButton.setEnabled(True)
        else:
            self.removeActionButton.setEnabled(False)
            self.editActionButton.setEnabled(False)
            self.deselectActionButton.setEnabled(False)

    #def getActionListFromEvent(self):



class LayerWidget(QWidget):
    def __init__(self, parent=None, **kwargs):
        QWidget.__init__(self, parent, **kwargs)

        self.VBox = QVBoxLayout(self)
        self.VBox.setAlignment(Qt.AlignTop)

        self.LabelLayer = QLabel("Layer is: %d" % 0)
        self.VBox.addWidget(self.LabelLayer)
        self.ButtonLayer = []

        for i in range(len(TileXtra.LayersName)):
            self.ButtonLayer.append(QPushButton(TileXtra.LayersName[i]))
            self.ButtonLayer[-1].setObjectName(TileXtra.LayersName[i])
            self.connect(self.ButtonLayer[-1], SIGNAL('clicked()'), self.changeLayerTo)    
            self.VBox.addWidget(self.ButtonLayer[-1])        

        self.setMaximumHeight(180)

        self.show()

    def changeLayerTo(self):
        #print self.sender().objectName()
        if str(self.sender().objectName()) == TileXtra.LayersName[0]:
            layerNumber = 0
        elif str(self.sender().objectName())  == TileXtra.LayersName[1]:
            layerNumber = 1
        elif str(self.sender().objectName())  == TileXtra.LayersName[2]:
            layerNumber = 2
        elif str(self.sender().objectName())  == TileXtra.LayersName[3]:
            layerNumber = COLISIONLAYER
        elif str(self.sender().objectName())  == TileXtra.LayersName[4]:
            layerNumber = EVENTSLAYER

        self.LabelLayer.setText("Current: %s" % str(self.sender().objectName()))
        changeLayerCurrent(layerNumber)


class PaletteWidget(QWidget):
    def __init__(self, parent=None, tileSetInstance=None, **kwargs):
        QWidget.__init__(self, parent, **kwargs)

        self.VBox = QVBoxLayout(self)

        self.tileSetInstance = tileSetInstance

        scrollArea = QtGui.QScrollArea()

        self.PaletteItems = QtGui.QWidget()
        self.Grid = QGridLayout()

        self.PaletteItems.setLayout(self.Grid)
        scrollArea.setWidget(self.PaletteItems)

        self.Grid.setHorizontalSpacing(0)
        self.Grid.setVerticalSpacing(0)
        self.Grid.setSpacing(0)
        self.Grid.setContentsMargins(0, 0, 0, 0)

        self.PaletteTileList = []

        self.drawPalette(tileSetInstance)

        self.CurrentTT = TileXtra.ExtendedQLabel(self)
        self.CurrentTT.initTile(tileSetInstance.tileset, len(tileSetInstance.tileset)-1  , 0 , tileSetInstance.boxsize, [5,0,0,0,0], 4)

        self.VBox.addWidget(scrollArea)
        self.VBox.addWidget(self.CurrentTT)

        self.setMinimumSize (tileSetInstance.boxsize*6+32,tileSetInstance.boxsize+32)

    def drawPalette(self, tileSetInstance):
        self.tileSetInstance = tileSetInstance

        if len(self.PaletteTileList) > 1:
            for wdgt in self.PaletteTileList:
                wdgt.deleteLater()
                wdgt = None
            self.PaletteTileList = []

        for i in range(len(tileSetInstance.tileset) ):
            self.PaletteTileList.append(TileXtra.ExtendedQLabel(self))
            self.Grid.addWidget(self.PaletteTileList[-1], i/6, i%6)
            self.PaletteTileList[-1].initTile( tileSetInstance.tileset, i , 0 , tileSetInstance.boxsize, [i,0,0,0,0], 1)
            self.connect(self.PaletteTileList[-1], SIGNAL('clicked()'), self.setTileCurrent)

        self.PaletteItems.resize(6*tileSetInstance.boxsize,TileXtra.divideRoundUp(len(tileSetInstance.tileset),6)*tileSetInstance.boxsize)
    
    def setTileCurrent(self):
        changeTileCurrent( self.sender().tileType[0])

    def setImageCurrent(self, imageIndex):
        self.CurrentTT.initTile( self.tileSetInstance.tileset, 0 , 0 ,  self.tileSetInstance.boxsize, [imageIndex,0,0,0,0], 4)
        self.CurrentTT.show()


class MainWindow(QMainWindow):
    def __init__(self, parent=None, **kwargs):
        QMainWindow.__init__(self, parent, **kwargs)

        self.resize(1024,768)

        self.undoStack = QUndoStack(self)

        self.levelName = "newFile"
        self.workingFile = self.levelName + ".json"

        self.myMap = TileXtra.MapFormat()

        self.myMap.new(self.levelName, 10, 10)

        self.scrollArea = QtGui.QScrollArea(self)

        # get tileset file and split it in images that can be pointed through array        
        self.myTileSet = TileXtra.TileSet( self.myMap.tileImage,self.myMap.palette)
        self.myMapWidget = MapWidget(self)

        self.scrollArea.setWidget(self.myMapWidget)
        
        self.setCentralWidget(self.scrollArea)

        self.FancyWindow()

    def selectStartPosition(self):
        result = TXWdgt.selectStartingPosition(self, sSettings)

        doSave=False
        if(result[1]!="this"):
            doSave=True
        else:
            if result[0]["World"]["initLevel"] not in result[0]["LevelsList"]:
                msg_msgbox = "The current level is not listed in LevelsList.\nMaybe you didn't save it or added to the list yet.\nProceed anyway?"
                reply = QtGui.QMessageBox.question(self, 'Message', 
                            msg_msgbox, QtGui.QMessageBox.Yes, QtGui.QMessageBox.No)
                if reply == QtGui.QMessageBox.Yes:
                    doSave=True
            else:
                doSave=True

        if(doSave):
            TXWdgt.saveInitFile(sSettings["gamefolder"], result[0])

    def FancyWindow(self):
        global sSettings

        self.menubar =  QtGui.QMenuBar()
        fileMenu = self.menubar.addMenu('&File')
        editMenu = self.menubar.addMenu('&Edit')
        fileMenu.addAction('&New', self.newFile, "Ctrl+N")
        fileMenu.addAction('&Open...', self.openFile, "Ctrl+O")
        fileMenu.addAction('&Save', self.saveFile, "Ctrl+S")
        fileMenu.addAction('&Save As...', self.saveFileAs, "Shift+Ctrl+S")
        fileMenu.addAction('&Export to JS...', self.exportToJsAs, "Shift+Ctrl+E")
        fileMenu.addAction('&Exit', self.close, "Ctrl+Q")    

        undoAction = self.undoStack.createUndoAction(self, self.tr("&Undo"))
        undoAction.setShortcuts(QKeySequence.Undo)
        editMenu.addAction(undoAction)
        redoAction = self.undoStack.createRedoAction(self, self.tr("&Redo"))
        redoAction.setShortcuts(QKeySequence.Redo)    
        editMenu.addAction(redoAction)
        editMenu.addAction('Set starting &position...', self.selectStartPosition, "")
        
        viewMenu = self.menubar.addMenu('&View')

        self.myPaletteWidget = PaletteWidget(self, self.myTileSet)
        self.paletteDockWdgt=QDockWidget("Palette", self)
        self.paletteDockWdgt.setWidget(self.myPaletteWidget)
        self.addDockWidget(Qt.RightDockWidgetArea, self.paletteDockWdgt)

        viewMenu.addAction(self.paletteDockWdgt.toggleViewAction())

        self.myLayerWidget = LayerWidget(self)
        self.layerDockWdgt=QDockWidget("Layers", self)
        self.layerDockWdgt.setWidget(self.myLayerWidget)
        self.addDockWidget(Qt.RightDockWidgetArea, self.layerDockWdgt)

        viewMenu.addAction(self.layerDockWdgt.toggleViewAction())

        self.myToolsWidget = ToolsWidget(self)
        self.toolsDockWdgt=QDockWidget("Tool", self)
        self.toolsDockWdgt.setWidget(self.myToolsWidget)
        self.addDockWidget(Qt.LeftDockWidgetArea, self.toolsDockWdgt)

        viewMenu.addAction(self.toolsDockWdgt.toggleViewAction())

        self.myEventsWidget = EventsWidget(self.myMap, self)
        self.eventsDockWdgt=QDockWidget("Tool", self)
        self.eventsDockWdgt.setWidget(self.myEventsWidget)
        self.addDockWidget(Qt.BottomDockWidgetArea, self.eventsDockWdgt)

        viewMenu.addAction(self.eventsDockWdgt.toggleViewAction())

        self.gridViewAction = QtGui.QAction('grid', viewMenu, checkable=True)
        viewMenu.addAction(self.gridViewAction )

        self.connect(self.gridViewAction , SIGNAL('changed()'), self.changeGridMargin)

        helpMenu = self.menubar.addMenu('&Help')
        helpMenu.addAction('About...', self.helpAbout)

        
        
        self.setMenuBar(self.menubar)

    def changeGridMargin(self):
        if self.gridViewAction.isChecked() is True:
            self.myMapWidget.Grid.setHorizontalSpacing(1)
            self.myMapWidget.Grid.setVerticalSpacing(1)
            self.myMapWidget.resize(self.myMapWidget.TileWidth*((32)*self.myMapWidget.myScale+1),self.myMapWidget.TileHeight*((32)*self.myMapWidget.myScale+1))
        else:
            self.myMapWidget.Grid.setHorizontalSpacing(0)
            self.myMapWidget.Grid.setVerticalSpacing(0)
            self.myMapWidget.resize(self.myMapWidget.TileWidth*32*self.myMapWidget.myScale,self.myMapWidget.TileHeight*32*self.myMapWidget.myScale)
        self.myMapWidget.show()
        

    def newFile(self):
        myNewFileDialog = TXWdgt.newFile(self)
        if myNewFileDialog.exec_() == QtGui.QDialog.Accepted:
            returnedNFD = myNewFileDialog.getValue()
            self.__newFile(returnedNFD)

    def __newFile(self,returnedNFD):
        global sSettings
        sSettings["gamefolder"] = returnedNFD["gameFolder"]
        self.levelName = returnedNFD["name"]
        self.workingFile = self.levelName + ".json"
        self.setWindowTitle(self.workingFile)
        self.myMap.new(self.levelName, returnedNFD["width"], returnedNFD["height"])
        self.myTileSet = TileXtra.TileSet( self.myMap.tileImage,self.myMap.palette)
        self.myMapWidget.DrawMap(self)
        m.gridViewAction.setChecked(False) #### gambiarra
        self.myPaletteWidget.drawPalette(self.myTileSet)
        self.myEventsWidget.updateEventsList()
        self.undoStack.clear()

    

    def saveFile(self):
        filename = self.workingFile
        if filename != "":
            self.myMap.save(filename)

    def saveFileAs(self):
        filename = QtGui.QFileDialog.getSaveFileName(self, 'Save File', os.path.expanduser("~"), 'JSON Game Level (*.json)') 
        if filename != "":
            self.workingFile = filename
            self.myMap.save(self.workingFile)

    def exportToJsAs(self):
        filename = QtGui.QFileDialog.getSaveFileName(self, 'Save File', os.path.expanduser("~"), 'JS Game Level (*.js)') 
        if filename != "":
            self.workingFile = filename
            self.myMap.exportJS(self.workingFile)

    def openFile(self):
        filename = QtGui.QFileDialog.getOpenFileName(self, 'Open File', os.path.expanduser("~")) 
        if os.path.isfile(filename):
            self.workingFile = filename
            self.setWindowTitle(self.workingFile)
            self.myMap.load(self.workingFile)
            self.myTileSet = TileXtra.TileSet( self.myMap.tileImage,self.myMap.palette)
            self.myMapWidget.DrawMap(self)
            m.gridViewAction.setChecked(False) #### gambiarra
            self.undoStack.clear()
            self.myPaletteWidget.drawPalette(self.myTileSet)
            self.myEventsWidget.updateEventsList()

    def helpAbout(self):
        QMessageBox.about(self, "About...", "Made by Erico")

    def closeEvent(self, event):
        quit_msg = "Do you want to save changes?"
        reply = QtGui.QMessageBox.question(self, 'Message', 
                     quit_msg, QtGui.QMessageBox.Yes, QtGui.QMessageBox.No, QtGui.QMessageBox.Cancel)

        if reply == QtGui.QMessageBox.Yes:
            event.accept()
            self.saveFile()
        elif reply == QtGui.QMessageBox.No:
            event.accept()
        else:
            event.ignore()



if __name__=="__main__":
    from sys import argv, exit

    a=QApplication(argv)
    m=MainWindow()
    m.show()
    m.raise_()
    exit(a.exec_())
