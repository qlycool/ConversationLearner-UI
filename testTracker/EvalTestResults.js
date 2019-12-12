const axios = require('axios')
const fs = require('fs')

const triageData = [
  {
    or: [
      `Timed out retrying: Stauts is queued - Still Waiting for Status == Running or Completed - Queued Wait Time:`,
      `Timed out retrying: Status is queued - Still Waiting for Status == Running or Completed - Queued Wait Time:`,
    ],
    bugs: [2415]
  },
  { 
    and: [`Timed out retrying: Expected to find element: 'button.ms-Dropdown-item[title="Enum"]', but never found it.`],
    bugs: [2409],
  },
  {
    and: [`Bugs 2389 & 2400 - Entity Detection panel shows a phrase that is different than the user's utterance.`],
    bugs: [2389, 2400]
  },
  {
    and: [
      "Timed out retrying: Expected to find content: 'z-rename-",
      "within the element: <div.css-69> but never did.",
    ],
    bugs: [2407],
  },
  {
    and: [`CypressError: Timed out retrying: Expected to find element: '[data-testid="app-index-model-name"]', but never found it.`],
    bugs: [2408],
  },
  {
    or: [`Expected to find content: 'world peace' within the element: [ <span.`],
    bugs: [2416],
  },
  {
    or: [
      `Expected to find element: '[data-testid="fuse-match-option"]', but never found it. Queried from element: <div.editor-container.`,
      `Response: What's your name? - Expected to find data-testid="action-scorer-button-clickable" instead we found "action-scorer-button-no-click"`
    ],
    bugs: [2396],
  },
  {
    or: [`Response: What's your name? - Expected to find data-testid="action-scorer-button-clickable" instead we found "action-scorer-button-no-click"`],
    bugs: [2408],
  },
  {
    testName: 'Settings.spec.js',
    and: [`RETRY - Loaded Model List Row Count does not yet match the aria-rowcount.`],
    bugs: [2418],
  },
  {
    testName: 'MissingAction.spec.js',
    and: [`Timed out retrying: Expected to find element: '[data-testid="action-scorer-button-clickable"]', but never found it. Queried from element: <div.ms-DetailsRow-fields.`],
    bugs: [2419],
  },
  {
    testName: 'Bug2379Repro.spec.js',
    and: [`Timed out retrying: Expected to find element: 'span[role="button"]', but never found it. Queried from element: <span.ms-TagItem-text.>`],
    comment: 'TEST BUG - Its been fixed, should see this working soon.',
  },
  {
    and: [`Chat turn 2 should be an exact match to: The user asks a silly question, however, we found The user asks another question instead`],
    comment: 'UI BUG is fixed - Test code modified to pass, should see this working soon.',
    bugs: [2265]
  },
  {
    testName: 'Regression-Log',
    and: [
      `Timed out retrying: Expected to find content:`,
      `within the element: <div.wc-message-content> but never did.`,
    ],
    bugs: [2197]
  }
]

async function GetTriageDetailsAboutTestFailure(log) {
  return await GetApiData(log.url).then(logText => {
    try {
      console.log(`GetTriageDetailsAboutTestFailure - start`)
      const searchForFailureMessage = '\nFailure Message: '
      let failureMessage
      
      let index = logText.lastIndexOf(searchForFailureMessage)
      if (index == -1) {
        console.log(`GetTriageDetailsAboutTestFailure - not found error`)
        failureMessage = 'ERROR: Failure Message was not found in this log file.'
      } else {
        failureMessage = logText.substring(index + searchForFailureMessage.length)

        for(let i = 0; i < triageData.length; i++) {
          console.log(`GetTriageDetailsAboutTestFailure - for i=${i}`)
          let testName = triageData[i].testName
          let and = triageData[i].and
          let or = triageData[i].or

          // testName is an "and" condition with the other "and" or "or" conditions.
          if (testName) {
            if (!log.key.includes(testName)) {
              console.log(`GetTriageDetailsAboutTestFailure - 'testName' - continue not a match`)
              continue // because this one is not a match
            }
          }

          if (and && Array.isArray(and)) {
            if (and.findIndex(matchString => !failureMessage.includes(matchString)) >= 0) {
              console.log(`GetTriageDetailsAboutTestFailure - 'and' - continue not a match`)
              continue // because this one is not a match
            }
            console.log(`GetTriageDetailsAboutTestFailure returns: { message: ${failureMessage}, bugs: ${triageData[i].bugs} }`)
            return { message: failureMessage, bugs: triageData[i].bugs, comment: triageData[i].comment }
          }
          
          if (or && Array.isArray(or)) {
            if (or.findIndex(matchString => failureMessage.includes(matchString)) >= 0) {
              console.log(`GetTriageDetailsAboutTestFailure returns: { message: ${failureMessage}, bugs: ${triageData[i].bugs} }`)
              return { message: failureMessage, bugs: triageData[i].bugs, comment: triageData[i].comment }
            }
            console.log(`GetTriageDetailsAboutTestFailure - 'or' - continue not a match`)
            continue // because this one is not a match
          }
        }
      }
      console.log(`GetTriageDetailsAboutTestFailure returns: ${failureMessage}`)
      return failureMessage
    }
    catch(error) {
      console.log(`!!! ERROR: ${error.message}`)
    }
  })
}

async function GetApiData(url) {
  return await axios.get(url).then(response => {
    return response.data
  })
  .catch(err => {
    console.log(`GetApiData - Error accessing: ${url}`)
    console.log(err.message)
  })
}

(async function() {

  let buildNumber
  let logs = []
  let mp4s = []
  let pngs = []
  let unknownTestFailures = []
  let knownTestFailures = []
  let passingTests = []
  let errors = []
  let htmlContent = ''

  let iStart
  let iEnd
  let iSpec
  let testName
  let key

  buildNumber = process.argv[2]

  const artifacts = await GetApiData(`https://circleci.com/api/v1.1/project/github/microsoft/ConversationLearner-UI/${buildNumber}/artifacts?circle-token=2ad1e457047948114cb3bbb1957d6f90c1e2ee25`)
  MoveArtifactJsonIntoArrays()
  console.log('Processing the Failed Test Results ----------------------------------')
  await ProcessFailingTestArtifacts()
  console.log('Processing the Passed Test Results ----------------------------------')
  ProcessPassingTestArtifacts()

  console.log('Rendering all Results to HTML ----------------------------------')
  RenderResults()

  console.log('Writing HTML to File ..\\results\\TestResults.html ----------------------------------')
  fs.writeFileSync('..\\results\\TestResults.html', htmlContent)

  function MoveArtifactJsonIntoArrays() {
    artifacts.forEach(artifact => {
      const suffix = artifact.url.substring(artifact.url.length - 3)
      switch (suffix) {
        case 'log':
            iStart = artifact.url.indexOf('/cypress/') + '/cypress/'.length
            iEnd = artifact.url.length - '.19.12.05.02.42.14..456.log'.length
            key = artifact.url.substring(iStart, iEnd)
            console.log(key)
            console.log(artifact.url)
            logs.push({ key: key, url: artifact.url })
          break

        case 'mp4':
            iStart = artifact.url.indexOf('/videos/') + '/videos/'.length
            iEnd = artifact.url.length - 4
            testName = artifact.url.substring(iStart, iEnd)
            key = testName.replace(/\/|\\/g, '-')
            console.log(testName)
            console.log(key)
            console.log(artifact.url)
            mp4s.push({ testName: testName, key: key, url: artifact.url })
          break
        
        case 'png':
          iStart = artifact.url.indexOf('/screenshots/') + '/screenshots/'.length
          iSpec = artifact.url.indexOf('.spec.', iStart)
          iEnd = artifact.url.indexOf('/', iSpec)
          testName = artifact.url.substring(iStart, iEnd)
          key = testName.replace(/\/|\\/g, '-')
          console.log(testName)
          console.log(key)
          console.log(artifact.url)
          pngs.push({ testName: testName, key: key, url: artifact.url })
          break
        
        default:
          break
      }
    })
  }

  async function ProcessFailingTestArtifacts() {
    for(let i = 0; i < pngs.length; i++) {
      const png = pngs[i]
      let error
      let failureDetails
      
      //if (png.testName.endsWith('.ts')) continue

      console.log(`*** PNG: ${png.testName} *****************************`)

      const log = logs.find(log => log.key === png.key)
      if (!log) {
        console.log(`ProcessFailingTestArtifacts - going to return since log is undefined`)  
        errors.push({ testName: png.testName, key: png.key, url: 'page error: Log file not found' })
        continue
      }
      
      console.log(`ProcessFailingTestArtifacts - going to await GetTriageDetailsAboutTestFailure`)
      failureDetails = await GetTriageDetailsAboutTestFailure(log)
      if (typeof failureDetails == 'string') {
        console.log(`ProcessFailingTestArtifacts got failureDetails: ${failureDetails}`)
      } else {
        console.log(`ProcessFailingTestArtifacts got failureDetails: { message: ${failureDetails.message}, bugs: ${failureDetails.bugs}, comment: ${failureDetails.comment} }`)
      }

      const mp4 = mp4s.find(mp4 => mp4.key === png.key)
      if (!mp4) {
        console.log('ProcessFailingTestArtifacts - ERROR: Did not find matching mp4')
        errors.push({ testName: png.testName, key: png.key, url: 'page error: mp4 file not found' })
        continue
      }

      let testFailure = {
        testName: png.testName,
        key: png.key,
        snapshotUrl: png.url,
        videoUrl: mp4.url,
        logUrl: log.url,
      }

      if (typeof failureDetails == 'string') {
        testFailure.failureMessage = failureDetails
        unknownTestFailures.push(testFailure)
        console.log('ProcessFailingTestArtifacts - Unknown Test Failure')
      } else {
        testFailure.failureMessage = failureDetails.message
        testFailure.bugs = failureDetails.bugs
        testFailure.comment = failureDetails.comment
        knownTestFailures.push(testFailure)
        console.log('ProcessFailingTestArtifacts - Known Test Failure')
      }
    }
  }

  function ProcessPassingTestArtifacts() {
    logs.forEach(log => {
      if (unknownTestFailures.findIndex(failure => failure.key === log.key) >= 0) return
      if (knownTestFailures.findIndex(failure => failure.key === log.key) >= 0) return

      const mp4 = mp4s.find(mp4 => mp4.key === log.key)
      if (!mp4) {
        errors.push({ testName: log.key, key: log.key, url: 'page error: mp4 file not found' })
        return
      }

      passingTests.push({
        testName: mp4.testName,
        videoUrl: mp4.url,
        logUrl: log.url,
      })
    })
  }

  function OLD_RenderResults() {
    console.log(`${unknownTestFailures.length} UNKNOWN TEST FAILURES -------------------------------------------------------`)
    unknownTestFailures.forEach(unknownTestFailure => {
      console.log(`unknownTestFailures.push({
        testName: '${unknownTestFailure.testName}',
        key: ${unknownTestFailure.key},
        snapshotUrl: '${unknownTestFailure.snapshotUrl}',
        videoUrl: '${unknownTestFailure.videoUrl}',
        logUrl: '${unknownTestFailure.logUrl}',
        failureMessage: '${unknownTestFailure.failureMessage}',
      })`)
    })

    console.log(`${knownTestFailures.length} KNOWN TEST FAILURES ---------------------------------------------------------`)
    knownTestFailures.forEach(knownTestFailure => {
      console.log(`knownTestFailures.push({
        testName: '${knownTestFailure.testName}',
        key: ${knownTestFailure.key},
        snapshotUrl: '${knownTestFailure.snapshotUrl}',
        videoUrl: '${knownTestFailure.videoUrl}',
        logUrl: '${knownTestFailure.logUrl}',
        failureMessage: '${knownTestFailure.failureMessage}',
        bugs: '${knownTestFailure.bugs}',
      })`)
    })

    console.log(`${passingTests.length} PASSING TESTS ---------------------------------------------------------------`)
    passingTests.forEach(passingTest => {
      console.log(`passingTests.push({
        testName: '${passingTest.testName}',
        videoUrl: '${passingTest.videoUrl}',
        logUrl: '${passingTest.logUrl}',
      })`)
    })

    console.log(`${errors.length} ERRORS ---------------------------------------------------------------`)
    errors.forEach(error => {
      console.log(`errors.push({
        testName: '${error.testName}',
        key: '${error.key}',
        url: '${error.url}',
      })`)
    })
  }

  function ReplaceSpecialHtmlCharacters(text) {
    return text.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;")
  }

  function RenderResults() {
    htmlContent = `
      <html>
      <head>
        <style>
        .grid-container1 {
          display: grid;
          grid-template-columns: auto;
          background-color: #2196F3;
          padding: 5px;
        }
    
        .grid-container2 {
          display: grid;
          grid-template-columns: auto auto;
          background-color: #2196F3;
          padding: 5px;
        }
    
        .grid-item {
          background-color: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(0, 0, 0, 0.8);
          padding: 5px;
          font-size: 15px;
          text-align: left;
        }
        </style>
      </head>
    
      <body>
        <h1>Test Results for Build Number <a href='https://circleci.com/gh/microsoft/ConversationLearner-UI/${buildNumber}#artifacts/containers/0' target='_blank'>${buildNumber}</a></h1>
        <div>
    `
    RenderUnknownFailures()
    htmlContent += `</div>
        <div>
    `
    RenderKnownFailures()
    htmlContent += `</div>
        <div>
    `

    RenderPassingTests()
    htmlContent += `</div>
  </body>
</html>`
  }
  
  function RenderUnknownFailures() {
    console.log(`${unknownTestFailures.length} UNKNOWN TEST FAILURES -------------------------------------------------------`)

    if (!unknownTestFailures || unknownTestFailures.length == 0) {
      htmlContent += `<h2>No Unknown Failures</h2>`
    } else {
      htmlContent += `
        <h2>${unknownTestFailures.length} Failures with an Unknown Cause</h2>
        <div class="grid-container2">
      `
      unknownTestFailures.forEach(unknownTestFailure => {
        htmlContent += `
          <div class="grid-item">
            <b>${unknownTestFailure.testName}</b><br>
            <a href='${unknownTestFailure.snapshotUrl}' target='_blank'>
              Snapshot
            </a> -- 
            <a href='${unknownTestFailure.videoUrl}' target='_blank'>Video</a>
          </div>

          <div class="grid-item">
            <b>Failure Message:</b> ${ReplaceSpecialHtmlCharacters(unknownTestFailure.failureMessage)}<br>
            <a href='${unknownTestFailure.logUrl}' target='_blank'>
              Log File
            </a><br>
          </div>
        `
      })
      htmlContent + '</div>'
    }
  }

  function RenderKnownFailures() {
    console.log(`${knownTestFailures.length} KNOWN TEST FAILURES ---------------------------------------------------------`)

    if (!knownTestFailures || knownTestFailures.length == 0) {
      htmlContent += `<h2>No Known Failures</h2>`
    } else {
      htmlContent += `
        <h2>${knownTestFailures.length} Failures with a Known Cause</h2>
        <div class="grid-container2">
      `
      knownTestFailures.forEach(knownTestFailure => {
        htmlContent += `
          <div class="grid-item">
            <b>${knownTestFailure.testName}</b><br>
            <a href='${knownTestFailure.snapshotUrl}' target='_blank'>
              Snapshot
            </a> -- 
            <a href='${knownTestFailure.videoUrl}' target='_blank'>Video</a>
          </div>

          <div class="grid-item">
        `
        if (knownTestFailure.comment) {
          htmlContent += `<b>${knownTestFailure.comment}</b><br>`
        }

        htmlContent += `
            <b>Failure Message:</b> ${ReplaceSpecialHtmlCharacters(knownTestFailure.failureMessage)}<br>
            <a href='${knownTestFailure.logUrl}' target='_blank'>
              Log File
            </a><br>
        `
        
        if (knownTestFailure.bugs) {
          knownTestFailure.bugs.forEach(bugNumber => {
            htmlContent += `
              <a href='https://dialearn.visualstudio.com/BLIS/_workitems/edit/${bugNumber}' target='_blank'>Bug ${bugNumber}</a> TODO: Bug Title to go here.<br>
            `
          })
        }
        htmlContent += `</div>`
      })
      htmlContent += '</div>'
    }
  }

  function RenderPassingTests() {
    console.log(`${passingTests.length} PASSING TESTS ---------------------------------------------------------------`)

    if (!passingTests || passingTests.length == 0) {
      htmlContent += `<h2>No Passing Tests</h2>`
    } else {
      htmlContent += `
        <h2>${passingTests.length} Passing Tests</h2>
        <div class="grid-container1">
      `
      passingTests.forEach(passingTest => {
        htmlContent += `
          <div class="grid-item">
            <b>${passingTest.testName}</b><br>
            <a href='${passingTest.videoUrl}' target='_blank'>
              Video
            </a> -- 
            <a href='${passingTest.logUrl}' target='_blank'>
              Log File
            </a><br>
          </div>
        `
      })
      htmlContent += `</div>`
    }
  }
}())
