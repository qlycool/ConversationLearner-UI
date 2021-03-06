/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { EntityBase, PredictedEntity } from '@conversationlearner/models'

export interface IEditorProps {
    options: IOption[]
    text: string
    customEntities: IGenericEntity<IGenericEntityData<PredictedEntity>>[]
    preBuiltEntities: IGenericEntity<IGenericEntityData<PredictedEntity>>[]
}

export interface InternalPredictedEntity {
    entity: EntityBase
    predictedEntity: PredictedEntity
}

export interface IEntityPickerProps {
    isOverlappingOtherEntities: boolean
    isVisible: boolean
    position: IPosition | null,
    builtInTypeFilter: string | null
}

export interface IPosition {
    top: number
    left: number
    bottom: number
}

export interface IOption {
    id: string
    name: string
    type: string
    resolverType: string | null
}

export interface IGenericEntity<T> {
    startIndex: number
    endIndex: number
    data: T
}

export interface IGenericEntityData<T> {
    option: IOption
    text: string
    displayName: string
    original: T
}

export enum NodeType {
    TokenNodeType = 'token-node',
    CustomEntityNodeType = "custom-inline-node",
    PreBuiltEntityNodeType = "prebuilt-inline-node"
}

export enum SegementType {
    Normal = "normal",
    Inline = "inline"
}

export interface ISegement {
    text: string
    startIndex: number
    endIndex: number
    type: SegementType
    data: any
}

export enum ExtractorStatus {
    ERROR = 'ERROR',
    WARNING = 'WARNING',
    OK = 'OK'
}
