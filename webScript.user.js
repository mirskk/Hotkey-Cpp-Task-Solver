// ==UserScript==
// @name         Hotkey browser detection and getting selected text
// @namespace    http://tampermonkey.net
// @version      1.1
// @description  Once hotkey is detected and there is selected text, it will print it out to the dev console. CTRL+SHIFT+Q (windows/linux)
// @author       You
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tampermonkey.net
// @grant        none
// @connect      localhost
// @match        *://*/*
// @match        *://translate.google.*/*
// @noframes
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';
    const popupHTML = ` <div id="tm-peek-overlay" style=" position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.4); display: none; justify-content: center; align-items: center; z-index: 999999; font-family: Arial, sans-serif; pointer-events: none; "> <div id="tm-peek-box" style=" background: #222; color: #fff; padding: 30px; border-radius: 12px; text-align: center; min-width: 250px; border: 2px solid #00d2d3; "> <h3 style="margin: 0 0 10px 0</h3> <h1 id="tm-peek-number" style="margin: 0; font-size: 48px;">0</h1> <p style="margin: 10px 0 0 0; font-size: 12px; color: #aaa;">Release keys to close</p> </div> </div> `;
    const div = document.createElement('div');
    div.innerHTML = popupHTML;
    document.body.appendChild(div);
    const overlay = document.getElementById('tm-peek-overlay');
    const peekNumber = document.getElementById('tm-peek-number');
    let currentActiveNumber = null;
    async function transferData(payload) {
        const url = 'http://localhost:3000/receive-text';
        const options = {
            method: 'POST',
            headers: {
                'Content-type': 'application/json'
            },
            body: JSON.stringify({
                text: payload
            })
        };
        try {
            const response = await fetch(url, options);
            const serverMessage = await response.text();
            console.log(`Server message: ${serverMessage}`);
        } catch (error) {
            console.log("Is server.js running?");
        }
    }
    window.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.shiftKey) {
            if (event.key.toLowerCase() === 'q') {
                event.preventDefault();
                overlay.style.display = 'flex';
                const getSelectedString = window.getSelection().toString();
                if (!getSelectedString) {
                    console.log('-1');
                    return;
                }
                transferData(getSelectedString);
            }
        }
    });
    window.addEventListener('keyup', (event) => {
        const releasedTheActiveNumber = (event.key === currentActiveNumber);
        const brokeTheModifierCombo = (!event.ctrlKey || !event.shiftKey);
        if (releasedTheActiveNumber || brokeTheModifierCombo) {
            overlay.style.display = 'none';
            currentActiveNumber = null;
        }
    });
})();
