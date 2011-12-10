// Copyright 2011 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.



/**
 * The expected ID of the install BITE link.
 */
var BITE_BUTTON_ID = 'bite-install-link';


/**
 * Simplified implementation of goog.bind
 *
 * @param {Function} func The function to bind.
 * @param {Object} inst The class instance to bind the function to.
 * @param {Array} args Additional arguments to pass to the function.
 * @return {Function} The function bound to the specified instance.
 */
function biteFuncBind(func, inst, args) {
  return function() {
    return func.apply(inst, Array.prototype.slice.call(arguments, 2));
  };
}



/**
 * Bug Details Popup class constructor.
 * @param {string} id The id of the element to tag the BITE popup to.
 * @constructor
 * @export
 */
function bitePopup(id) {
  /**
   * The id of the element this popup will appear beneath.
   * @type {string}
   * @private
   */
  this.parentElementId_ = id;

  // Only load the popup if the browser is chrome.
  var is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
  if (is_chrome) {
    // Attach the initial listeners to the parent element for this popup.
    var parentLink = document.getElementById(id);
    parentLink.addEventListener('mouseover', biteFuncBind(this.create, this),
                                [true, false]);
    parentLink.addEventListener('mouseout', biteFuncBind(this.remove, this),
                                [true, false]);
  }
}


/**
 * The x offset of the popup from it's parent element.
 * @type {number}
 * @private
 */
bitePopup.OFFSET_X_ = -205;


/**
 * The y offset of the popup from it's parent element.
 * @type {number}
 * @private
 */
bitePopup.OFFSET_Y_ = 26;


/**
 * A flag to remove the popup.
 * @type {boolean}
 * @private
 */
bitePopup.prototype.removeFlag_ = false;


/**
 * The amount of time (in ms) the popup will stay up after the user leaves it.
 * @type {number}
 * @private
 */
bitePopup.BITE_POPUP_DURATION_MS_ = 250;


/**
 * The id of the BITE popup container.
 * @type {string}
 * @export
 */
bitePopup.BITE_POPUP_CONTAINER_ID = 'bite-download-popup-container';


/**
 * Finds the position of an element by using the accumulated offset position
 * of the element and it's ancestors.
 * @param {!Element} element The HTML element to find the position of.
 * @return {!{x: number, y: number}} The x, y coordinates of the element.
 * @private
 */
bitePopup.findPosition_ = function(element) {
  var elementLeft = element.offsetLeft;
  var elementTop = element.offsetTop;

  if (element.offsetParent) {
    while (element = element.offsetParent) {
      elementLeft += element.offsetLeft;
      elementTop += element.offsetTop;
    }
  }
  return {x: elementLeft, y: elementTop};
};


/**
 * Creates the popup underneath the "parent" element.
 * @export
 */
bitePopup.prototype.create = function() {
  this.removeFlag_ = false;

  // Don't create a duplicate popup if one already exists.
  if (this.isOpen_()) {
    return;
  }

  // Retrieve the parent element to append the popup to.
  var parent = document.getElementById(this.parentElementId_);
  if (!parent) {
    console.error('Unable to find the specified parent element provided: ' +
                  this.parentElementId_);
    return;
  }

  // Retrieve the position of the parent element, and computes the position
  // of the popup.
  //TODO(bustamante): Handle cases when this doesn't appear in the viewport.
  var parentPosition = bitePopup.findPosition_(parent);
  var popupLeft = parentPosition['x'] + bitePopup.OFFSET_X_;
  var popupTop = parentPosition['y'] + bitePopup.OFFSET_Y_;


  // Create the popup container.
  var popup = document.createElement('div');
  popup.setAttribute('id', bitePopup.BITE_POPUP_CONTAINER_ID);
  popup.setAttribute('style',
                     'position:absolute; top:' + popupTop + 'px; ' +
                     'left: ' + popupLeft + 'px; width: 355px; ' +
                     'height: 130px; background-color: #fff; ' +
                     'border: 1px solid rgba(0,0,0,0.2); ' +
                     '-webkit-border-radius: 2px; ' +
                     '-moz-border-radius: 2px; ' +
                     'border-radius: 2px; ' +
                     'box-shadow: 0 2px 4px rgba(0,0,0,0.2); ' +
                     '-moz-box-shadow: 0 2px 4px rgba(0,0,0,0.2); ' +
                     '-webkit-box-shadow: 0 2px 4px rgba(0,0,0,0.2); ' +
                     'z-index: 999999;');

  // Create the logo and append it to the popup container.
  var logo = document.createElement('img');
  logo.setAttribute('style', 'position: absolute; top: 10px; left: 10px; ' +
                             'width:150px; height: 80px');
  logo.setAttribute('src', 'https://YOUR_SERVER/imgs/' +
                           'bite_logo_google.png');
  popup.appendChild(logo);

  // Create the BITE title and append it to the popup container.
  var title = document.createElement('span');
  title.setAttribute('style', 'position: absolute; left: 180px; top: 10px; ' +
                              'font-weight: BOLD; font-family: arial; ' +
                              'font-size: 13px;');
  title.innerHTML = 'File your bugs with BITE';
  popup.appendChild(title);

  // Create a bullet point and append it to the popup container.
  var simplifyBullet = document.createElement('span');
  simplifyBullet.setAttribute('style', 'position: absolute; left: 185px; ' +
                                       'top: 35px; font-family: arial; ' +
                                       'font-size: 13px;');
  simplifyBullet.innerHTML = '<li>Simplifies Bug Filing</li>';
  popup.appendChild(simplifyBullet);

  // Create another bullet point and append it to the popup container.
  var attachesBullet = document.createElement('span');
  attachesBullet.setAttribute('style', 'position: absolute; left: 185px; ' +
                                       'top: 52px; font-family: arial; ' +
                                       'font-size: 13px;');
  attachesBullet.innerHTML = '<li>Attaches Debug Data</li>';
  popup.appendChild(attachesBullet);

  // Create a final bullet point and append it to the popup container.
  var learnMoreBullet = document.createElement('span');
  learnMoreBullet.setAttribute('style', 'position: absolute; left: 185px; ' +
                                        'top: 69px; font-family: arial; ' +
                                        'font-size: 13px;');
  learnMoreBullet.innerHTML = '<li>Learn more at <a style="color: #22A" ' +
                              'href="" target="_blank">' +
                              'go/bite</a></li>';
  popup.appendChild(learnMoreBullet);

  // Create a download link and append it to the popup container.
  var downloadLink = document.createElement('a');
  downloadLink.setAttribute('href', 'http://YOUR_SERVER/' +
                                    'get_latest_extension');
  downloadLink.setAttribute('style', 'position: absolute; top: 104px; ' +
                                     'left: 40px; color: #22A; font-family: ' +
                                     'arial; font-size: 11px; ' +
                                     'cursor:pointer');
  downloadLink.setAttribute('target', '_blank');
  downloadLink.innerHTML = 'Download and Install the BITE chrome extension';
  downloadLink.addEventListener('click', biteFuncBind(this.remove, this),
                                false);
  popup.appendChild(downloadLink);

  // Create the arrow effect at the top of the top this is done in two phases,
  // with this being the base
  var arrowBase = document.createElement('div');
  arrowBase.setAttribute('style', 'position: absolute; top: -20px; ' +
                                  'left: 260px; width: 0; height: 0; ' +
                                  'border-width: 10px; border-style: solid; ' +
                                  'border-color: transparent transparent ' +
                                  'rgba(0,0,0,0.2) transparent');
  popup.appendChild(arrowBase);

  // Create the white area of the arrow to overlay on top of the base.
  var arrow = document.createElement('div');
  arrow.setAttribute('style', 'position: absolute; top: -18px; left: 260px; ' +
                              'width: 0; height: 0; border-width: 10px; ' +
                              'border-style: solid; border-color: ' +
                              'transparent transparent #fff transparent');
  popup.appendChild(arrow);

  // Add the event listeners for mouse-in and mouse-out.
  popup.addEventListener('mouseover', biteFuncBind(this.create, this),
                         false);
  popup.addEventListener('mouseout', biteFuncBind(this.remove, this),
                         false);

  // Finally attach the popup to the document body, not the "parent" element
  // itself as that can result in the popup being clipped and not displaying
  // properly.
  document.body.appendChild(popup);
};


/**
 * Determines whether the popup exists by doing a getElementById.
 * @return {boolean} Whether the popup exists or not.
 * @private
 */
bitePopup.prototype.isOpen_ = function() {
  var popup = document.getElementById(bitePopup.BITE_POPUP_CONTAINER_ID);
  return !!popup;
};


/**
 * Flags the popup for removal and kicks off a thread to conditionally
 * destroy it.
 * @export
 */
bitePopup.prototype.remove = function() {
  this.removeFlag_ = true;
  setTimeout(biteFuncBind(this.destroyPopupIfFlagged_, this),
             bitePopup.BITE_POPUP_DURATION_MS_);
};


/**
 * Destroys the BITE popup if it's flagged for removal.
 * @private
 */
bitePopup.prototype.destroyPopupIfFlagged_ = function() {
  if (this.removeFlag_) {
    this.destroy_();
  }
};


/**
 * Destroys the BITE popup.
 * @private
 */
bitePopup.prototype.destroy_ = function() {
  var popup = document.getElementById(bitePopup.BITE_POPUP_CONTAINER_ID);
  if (popup) {
    popup.parentNode.removeChild(popup);
  }
};


// Create an instance of the BITE popup.
var popupInstance = new bitePopup(BITE_BUTTON_ID);

