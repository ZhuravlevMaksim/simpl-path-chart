import * as React from 'react'
import {useEffect, useState} from 'react'
import styles from './styles.module.css'

const defs = {
    nodeWidth: 400,
    nodeHeight: 30,
    pathLength: 100
}

interface Interface {
    data: any[]
}

interface Node {
    label: string
    x: number
    y: number
}

export const SimpleNodeChart = ({data}: Interface) => {
    const [nodes, setNodes] = useState<Node[]>([])
    const [paths, setPaths] = useState<any[]>([])
    const [svgSize, setSvgSize] = useState<any>({width: 0, height: 0})

    useEffect(() => {
        const {nodes, paths, svgWidth, svgHeight} = calculateNodes(data)
        setNodes(nodes)
        setPaths(paths)
        setSvgSize({width: svgWidth, height: svgHeight})
    }, [])

    return (
        <div className={styles.chart}>
            {nodes.map((data) => <Node {...data} />)}
            <svg {...svgSize}>
                {paths.map((d) => {
                    return <Path d={d}/>
                })}
            </svg>
        </div>
    )
}

const Path = ({d}: any) => {

    return (
        <path

            className={styles.path}
            fill='transparent'
            d={d}
        />
    )
}

const Node = ({label, x, y}: Node) => {
    return (
        <div
            onClick={() => console.log(label)}
            className={styles.node}
            style={{position: 'absolute', left: x, top: y}}>
            {label}
        </div>
    )
}

const calculateNodes = (data: any[]) => {
    const nodes = {}
    const children = {}

    data.forEach(({old: parent, new: child, count}) => {
        const parentNode = nodes[parent] ? nodes[parent] : new ClassNode(parent, 0)
        const childNode = nodes[child] ? nodes[child] : new ClassNode(child, count)
        if (nodes[parent]) {
            nodes[parent].addChild(childNode)
        } else {
            nodes[parent] = parentNode
        }
        children[child] = true
    }, {})

    const parents = Object.keys(nodes)
        .filter((key) => children[key] === undefined)
        .map((key) => nodes[key])

    return hofPosition(parents)
}

const hofPosition = (parents: any[]) => {

    const nodes: any[] = []
    const paths: any[] = []
    const maxSize = {height: 0, width: 0}

    getPosition({
        column: 0,
        nodesInColumn: {},
        parents,
        nodes,
        paths,
        drawn: {},
        maxSize
    })

    return {nodes, paths, svgWidth: maxSize.width + defs.nodeWidth, svgHeight: maxSize.height + defs.nodeHeight}
}

const getPosition = ({
                         column,
                         nodesInColumn,
                         parents,
                         nodes,
                         paths,
                         drawn,
                         previousParentPosition,
                         maxSize
                     }: any) => {
    if (parents && parents.length) {
        const {nodeWidth, nodeHeight, pathLength} = defs
        nodesInColumn[column] = nodesInColumn[column] ? nodesInColumn[column] : 0

        const localNodes: any[] = []

        parents.forEach(({name, children}: ClassNode) => {
            if (drawn[name]) {
                const {x: parentX, y: parentY} = previousParentPosition
                const {x, y} = drawn[name]

                const start = `M ${parentX + nodeWidth} ${parentY + nodeHeight / 2}`
                const curvePoint = `C ${parentX + nodeWidth + pathLength / 2} ${
                    parentY + nodeHeight
                } ${x - pathLength / 2} ${y + nodeHeight}`
                const end = `${x} ${y + nodeHeight / 2}`

                paths.push(`${start} ${curvePoint} ${end}`)

                return
            }
            const parentPosition = {
                label: name,
                x: column * (nodeWidth + pathLength),
                y: nodesInColumn[column]++ * (nodeHeight + pathLength / 2)
            }

            if (parentPosition.x > maxSize.width) maxSize.width = parentPosition.x
            if (parentPosition.y > maxSize.height) maxSize.height = parentPosition.y

            drawn[name] = parentPosition
            nodes.push(parentPosition)
            localNodes.push(parentPosition)

            getPosition({
                column: column + 1,
                nodesInColumn,
                parents: children,
                nodes,
                paths,
                drawn,
                previousParentPosition: parentPosition,
                maxSize
            }).forEach((position) => {
                const {x: parentX, y: parentY} = parentPosition
                const {x, y} = position

                const start = `M ${parentX + nodeWidth} ${parentY + nodeHeight / 2}`
                const curvePoint = `C ${parentX + nodeWidth + pathLength / 2} ${
                    parentY + nodeHeight
                } ${x - pathLength / 2} ${y + nodeHeight}`
                const end = `${x} ${y + nodeHeight / 2}`

                paths.push(`${start} ${curvePoint} ${end}`)
            })
        })
        return localNodes
    }
    return []
}

class ClassNode {
    children: ClassNode[] = []
    name: string;
    count: number;

    constructor(name: string, count: number) {
        this.name = name
        this.count = count
    }

    addChild(node: ClassNode) {
        this.children.push(node)
    }
}