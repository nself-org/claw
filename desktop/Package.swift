// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "nClaw",
    platforms: [
        .macOS(.v13)
    ],
    products: [
        .executable(name: "nClaw", targets: ["nClaw"])
    ],
    targets: [
        .executableTarget(
            name: "nClaw",
            path: "Sources",
            resources: [
                .process("../Resources")
            ]
        )
    ]
)
