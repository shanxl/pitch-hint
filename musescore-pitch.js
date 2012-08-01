//=============================================================================
//  MuseScore Plugin
//  Mark note pitch numbers on the top of the staves
//
//  Written by Shan Xiaolong, 2012
//  Based on Note Names plugin by Werner Schweer and others
//
//  This program is free software; you can redistribute it and/or modify
//  it under the terms of the GNU General Public License version 2.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program; if not, write to the Free Software
//  Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.
//=============================================================================

//---------------------------------------------------------
//    init
//    this function will be called on startup of mscore
//    it is mandatory
//---------------------------------------------------------
function init() {
}

//---------------------------------------------------------
//  getPitchName
//  tpc: tonal pitch class
//  Tonal Pitch Classes in numeric order
// -1  Fbb = Eb    6  Fb = E    13  F     20  F#        27  F## = G
//  0  Cbb = Bb    7  Cb = B    14  C     21  C#        28  C## = D
//  1  Gbb = F     8  Gb = F#   15  G     22  G#        29  G## = A
//  2  Dbb = C     9  Db = C#   16  D     23  D# = Eb   30  D## = E
//  3  Abb = G    10  Ab = G#   17  A     24  A# = Bb   31  A## = B
//  4  Ebb = D    11  Eb        18  E     25  E# = F    32  E## = F#
//  5  Bbb = A    12  Bb        19  B     26  B# = C    33  B## = C#
//
//  keySig: key signature
//  -7 (= 7 flats) to 7 (= 7 sharps) or undefined for custom signature
//---------------------------------------------------------
function getPitchName(tpc, keySig) {
  var pitch, pitchName;
  pitchName = ["1", "1#", "2", "3b", "3", "4", "4#", "5", "5#", "6", "7b", "7", "?"];
  // pitchName = ["d", "di", "r", "ma", "m", "f", "fi", "s", "si", "l", "ta", "t", "?"];

  switch (tpc) {
    case  2: case 14: case 26: pitch =  0; break; // C
    case  9: case 21: case 33: pitch =  1; break; // C#
    case  4: case 16: case 28: pitch =  2; break; // D
    case -1: case 11: case 23: pitch =  3; break; // Eb
    case  6: case 18: case 30: pitch =  4; break; // E
    case  1: case 13: case 25: pitch =  5; break; // F
    case  8: case 20: case 32: pitch =  6; break; // F#
    case  3: case 15: case 27: pitch =  7; break; // G
    case 10: case 22:          pitch =  8; break; // G#
    case  5: case 17: case 29: pitch =  9; break; // A
    case  0: case 12: case 24: pitch = 10; break; // Bb
    case  7: case 19: case 31: pitch = 11; break; // B
    default: pitch = 12;
  }

  if (pitch !== 12) {
    switch (keySig) {
      case 1: pitch -= 7; break; // G major
      case 2: pitch -= 2; break; // D major
      case 3: pitch -= 9; break; // A major
      case 4: pitch -= 4; break; // E major
      case 5: case -7: pitch -= 11; break; // B  major, Cb major
      case 6: case -6: pitch -= 6;  break; // F# major, Gb major
      case 7: case -5: pitch -= 1;  break; // C# major, Db major
      case -4: pitch -=  8; break; // Ab major
      case -3: pitch -=  3; break; // Eb major
      case -2: pitch -= 10; break; // Bb major
      case -1: pitch -=  5; break; // F  major
      // no default really required here
    }
    pitch += 12;
    pitch %= 12;
  }
  return pitchName[pitch];
}

//---------------------------------------------------------
//    get part names of each staff
//---------------------------------------------------------
function getPartNames(score) {
  var i, j, name;
  name = [];
  for (i = 0; i < score.parts; i++) {
    for (j = 0; j < score.part(i).staves; j++) {
      name.push(score.part(i).longName);
    }
  }
  return name;
}



//---------------------------------------------------------
//    run
//    this function will be called when activating the
//    plugin menu entry
//---------------------------------------------------------
function run() {
  var cursor, pName, nameFont, staff, text;

  // curScore is a global variable, it is a Score object
  // and means the score currently active in MuseScore
  if (typeof curScore === 'undefined') {
    // no socre is open
    return;
  }

  // Cursor object allows navigation in an open score 
  // and allows access to its elements.
  cursor   = new Cursor(curScore);

  // Names of each staff, e.g. Tenor, Bass, Piano
  pName = getPartNames(curScore);

  // font of pitch names
  nameFont = new QFont("Courier", 12);

  // stave is another term for staff
  // it is the five lines that music is written on
  for (staff = 0; staff < curScore.staves; ++staff) {
    // skip Piano part
    if (pName[staff] === "Piano") {
      continue;
    }

    // staves are numbered from top to bottom, starting with 0
    // the number of staves of a score can be obtained with score.staves
    cursor.staff = staff;

    // contains the voice (within the current staff) the cursor is
    // currently browsing; voices are numbered from top to bottom, from 0 to 3
    cursor.voice = 0;

    // positions the cursor at the beginning of the set staff/voice 
    cursor.rewind();

    // cursor.eos() 
    // returns true if the cursor is currently at end of the current voice/staff
    while (!cursor.eos()) {
      // cursor.isChord() test if it has notes (or a rest)
      if (cursor.isChord()) {
        text  = new Text(curScore);

        // Chord Object, chord.topNote() === chord.note(-1)
        //               get number of notes: chord.notes
        //               tpc is the Tonal Pitch Class
        if (cursor.chord().notes >= 2) {
          text.text = getPitchName(cursor.chord().topNote().tpc, curScore.keysig);
          text.text = text.text + "\n" + getPitchName(cursor.chord().note(0).tpc, curScore.keysig);
          text.yOffset = -7;
        }
        else {
          text.text = getPitchName(cursor.chord().topNote().tpc, curScore.keysig);
          text.yOffset = -5;
        }

        // offset unit is the vertical distance between two lines of a staff
        // x: positive: to the right, negative: to the left
        // y: positive: down, negative: up
        //if (cursor.chord().topNote().pitch > 83) {
        //  text.xOffset = 1;
        // }

        // other properties of Text object
        // color        QColor  the text foreground colour.
        // defaultFont  QFont  the font used to display the text.
        text.defaultFont = nameFont;

        // Currently, only 'staff text' elements can be added to a score
        cursor.putStaffText(text);
      }
      cursor.next();
    }
  }
}

//---------------------------------------------------------
//    menu:  defines were the function will be placed
//           in the MuseScore menu structure
//---------------------------------------------------------
var mscorePlugin = {
  majorVersion: 1,
  minorVersion: 1,
  menu: 'Plugins.Pitch Hint',
  init: init,
  run:  run
};

mscorePlugin;
