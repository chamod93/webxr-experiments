import * as THREE from "./node_modules/three/build/three.module.js"


function Mesh(data, mesher, scaleFactor, three) {
    console.log("mesh with data",data)
    this.data = data
    var geometry = this.geometry = new THREE.Geometry()
    this.scale = scaleFactor || new THREE.Vector3(10, 10, 10)

    var result = mesher( data.voxels, data.dims )
    this.meshed = result

    geometry.vertices.length = 0
    geometry.faces.length = 0

    for (var i = 0; i < result.vertices.length; ++i) {
        var q = result.vertices[i]
        geometry.vertices.push(new THREE.Vector3(q[0], q[1], q[2]))
    }

    for (var i = 0; i < result.faces.length; ++i) {
        geometry.faceVertexUvs[0].push(this.faceVertexUv(i))

        var q = result.faces[i]
        // console.log("face",q)
        if (q.length === 5) {
            var f = new THREE.Face3(q[0], q[1], q[2])//, q[3])
            f.color = new THREE.Color(q[4])
            geometry.faces.push(f)

            const f2 = new THREE.Face3(q[0],q[2],q[3])
            f2.color = new THREE.Color(q[4])
            geometry.faces.push(f2)

        } else if (q.length === 4) {
            var f = new THREE.Face3(q[0], q[1], q[2])
            f.color = new THREE.Color(q[3])
            geometry.faces.push(f)
        }
    }

    geometry.computeFaceNormals()

    geometry.verticesNeedUpdate = true
    geometry.elementsNeedUpdate = true
    geometry.normalsNeedUpdate = true

    geometry.computeBoundingBox()
    geometry.computeBoundingSphere()

}

Mesh.prototype.createWireMesh = function(hexColor) {
    var wireMaterial = new THREE.MeshBasicMaterial({
        color : hexColor || 0xffffff,
        wireframe : true
    })
    const wireMesh = new THREE.Mesh(this.geometry, wireMaterial)
    wireMesh.scale = this.scale
    wireMesh.doubleSided = true
    this.wireMesh = wireMesh
    return wireMesh
}

Mesh.prototype.createSurfaceMesh = function(material) {
    material = material || new THREE.MeshNormalMaterial()
    var surfaceMesh  = new THREE.Mesh( this.geometry, material )
    surfaceMesh.scale.copy(this.scale)
    // surfaceMesh.scale = this.scale
    surfaceMesh.doubleSided = false
    this.surfaceMesh = surfaceMesh
    return surfaceMesh
}

Mesh.prototype.addToScene = function(scene) {
    if (this.wireMesh) scene.add( this.wireMesh )
    if (this.surfaceMesh) scene.add( this.surfaceMesh )
}

Mesh.prototype.setPosition = function(x, y, z) {
    if (this.wireMesh) this.wireMesh.position = new THREE.Vector3(x, y, z)
    if (this.surfaceMesh) this.surfaceMesh.position = new THREE.Vector3(x, y, z)
}

Mesh.prototype.faceVertexUv = function(i) {
    var vs = [
        this.meshed.vertices[i*4+0],
        this.meshed.vertices[i*4+1],
        this.meshed.vertices[i*4+2],
        this.meshed.vertices[i*4+3]
    ]
    var spans = {
        x0: vs[0][0] - vs[1][0],
        x1: vs[1][0] - vs[2][0],
        y0: vs[0][1] - vs[1][1],
        y1: vs[1][1] - vs[2][1],
        z0: vs[0][2] - vs[1][2],
        z1: vs[1][2] - vs[2][2]
    }
    var size = {
        x: Math.max(Math.abs(spans.x0), Math.abs(spans.x1)),
        y: Math.max(Math.abs(spans.y0), Math.abs(spans.y1)),
        z: Math.max(Math.abs(spans.z0), Math.abs(spans.z1))
    }
    if (size.x === 0) {
        if (spans.y0 > spans.y1) {
            var width = size.y
            var height = size.z
        }
        else {
            var width = size.z
            var height = size.y
        }
    }
    if (size.y === 0) {
        if (spans.x0 > spans.x1) {
            var width = size.x
            var height = size.z
        }
        else {
            var width = size.z
            var height = size.x
        }
    }
    if (size.z === 0) {
        if (spans.x0 > spans.x1) {
            var width = size.x
            var height = size.y
        }
        else {
            var width = size.y
            var height = size.x
        }
    }
    if ((size.z === 0 && spans.x0 < spans.x1) || (size.x === 0 && spans.y0 > spans.y1)) {
        return [
            new THREE.Vector2(height, 0),
            new THREE.Vector2(0, 0),
            new THREE.Vector2(0, width),
            new THREE.Vector2(height, width)
        ]
    } else {
        return [
            new THREE.Vector2(0, 0),
            new THREE.Vector2(0, height),
            new THREE.Vector2(width, height),
            new THREE.Vector2(width, 0)
        ]
    }
}
;


export const VMesh = Mesh