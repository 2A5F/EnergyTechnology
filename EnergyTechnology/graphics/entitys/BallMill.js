module.exports = {
    type: 'animation',
    name: 'BallMill',
    speed: 15,
    front: {
        from: 45,
        to: 89,
        point: '↖',
        width: '100%',
        height: '50%'
    },
    back: {
        from: 90,
        to: 134,
        point: '↖',
        width: '100%',
        height: '50%'
    },
    right: {
        from: 135,
        to: 179,
        point: '↗',
        x: 1 / 8,
        width: 3 / 4 - 1 / 8,
        height: 3 / 4
    },
    left: {
        from: 180,
        to: 224,
        point: '↗',
        x: 1 / 8,
        width: 3 / 4 - 1 / 8,
        height: 3 / 4
    }
}