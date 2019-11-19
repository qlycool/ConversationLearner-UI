/**
* Copyright (c) Microsoft Corporation. All rights reserved.  
 * Licensed under the MIT License.
*/

import * as models from '../../support/Models'
import * as modelPage from '../../support/components/ModelPage'
import * as settings from '../../support/components/Settings'
import * as exportModelModal from '../../support/components/ExportModelModal'
import * as trainDialogsGrid from '../../support/components/TrainDialogsGrid'
import * as helpers from '../../support/Helpers'

describe('Export Model', () => {
  afterEach(helpers.SkipRemainingTestsOfSuiteIfFailed)

  context('Setup', () => {
    it('Should import a model to test against', () => {
      models.ImportModel('z-temp', 'z-entityTests.cl')
    })
  })

  context('Export this Model', () => {
    it('Navigate to the settings view', () => {
      modelPage.NavigateToSettings()
    })

    it('Export the Model', () => {
      settings.ClickExportModelButton()
      exportModelModal.ClickExportButton()
    })

    it('Navigate to Train Dialogs and Edit One of Them', () => {
      modelPage.NavigateToTrainDialogs()
      trainDialogsGrid.TdGrid.EditTrainingByChatInputs('Hey', 'world peace', "Sorry $name, I can't help you get $want")
    })

  })
})