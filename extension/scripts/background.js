/* global chrome */
(function () {
  let enabled = false
  let idx = 0;

  // get stored settings
  chrome.storage.sync.get({ idx: 0, enabled: true }, function (items) {
    if (chrome.runtime.lastError) {
      console.log(chrome.runtime.lastError)
    }
    idx = items.idx
    enabled = (idx > 0)
    update()
  })

  // execute script in all tabs
  function executeScriptInAllTabs (script) {
    chrome.tabs.query({ windowType: 'normal' }, function (tabs) {
      for (const tab of tabs) {
        if (tab.url.indexOf('chrome://') !== 0) {
          chrome.tabs.executeScript(tab.id, { code: script })
        }
      }
    })
  }

  // update status and store settings
  function update () {
    if (enabled) {
      const details = {
        path: {
          '19': 'icons/icon_'+idx+'.png',
          '38': 'icons/icon_'+idx+'.png'
        }
      }

      chrome.storage.sync.set({ idx: idx, enabled: true })
      chrome.browserAction.setIcon(details)
      executeScriptInAllTabs('if (typeof speenya !== "undefined") speenya.connect();')
    } else {
      const details = {
        path: {
          '19': 'icons/icon19_disabled.png',
          '38': 'icons/icon38_disabled.png'
        }
      }

      chrome.storage.sync.set({ idx: idx, enabled: false })
      chrome.browserAction.setIcon(details)
      executeScriptInAllTabs('if (typeof speenya !== "undefined") speenya.disconnect();')
    }
  }

  chrome.browserAction.onClicked.addListener(function (tab) {
//    enabled = !enabled
    idx = (idx+1)  % 5
    enabled = (idx>0)
    chrome.tabs.sendMessage(tab.id, { 'action': 'chnage_idx', 'idx': idx });
    update()
  })

  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.message === 'checkEnabled') { sendResponse({ idx: idx, enabled: enabled })
      return true
    }
  })
})()
