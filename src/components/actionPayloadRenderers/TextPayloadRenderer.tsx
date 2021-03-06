/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as React from 'react'
import * as OF from 'office-ui-fabric-react'
import './TextPayloadRenderer.css'

interface Props {
    original: string
    currentMemory: string | null
}

interface State {
    isOriginalVisible: boolean
}

export default class Component extends React.Component<Props, State> {
    state: Readonly<State> = {
        isOriginalVisible: false
    }

    onChangeVisible = () => {
        this.setState(prevState => ({
            isOriginalVisible: !prevState.isOriginalVisible
        }))
    }

    render() {
        const showToggle = this.props.currentMemory !== null && this.props.currentMemory !== this.props.original

        return <div className={`cl-text-payload ${OF.FontClassNames.mediumPlus}`}>
            <div data-testid="action-scorer-text-response">{(this.props.currentMemory === null || this.state.isOriginalVisible)
                ? this.props.original
                : this.props.currentMemory
            }</div>
            {showToggle && <div>
                <OF.Toggle
                    data-testid="action-scorer-entity-toggle"
                    checked={this.state.isOriginalVisible}
                    onChange={this.onChangeVisible}
                />
            </div>}
        </div>
    }
}