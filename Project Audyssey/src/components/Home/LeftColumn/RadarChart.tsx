import { Canvas } from "@react-three/fiber";
import * as drei from "@react-three/drei";

const radius = 100;

export function RadarChart(props: {
    radialData: {name: string, value: number}[]
}) {
    return(<div className="radial-chart">
        <Canvas>
            <drei.OrthographicCamera position={[0, 0, 100]} makeDefault />
            <polarGridHelper
                args={[
                    100, // radius
                    props.radialData.length, // sectors
                    10, // rings
                    64, // line segments
                    0x555555,
                    0x666666,
                ]}
                rotation={[Math.PI/2, Math.PI/8, 0]}
            />
            {
                props.radialData.map((attr, idx) => {
                    return(<group>
                    <mesh rotation={[0, 0, 0]}>
                        <circleGeometry args={[
                            attr.value * radius, // radius
                            8, // segments
                            (Math.PI * ((2*idx) + 3))/props.radialData.length, // thetaStart
                            Math.PI/props.radialData.length * 2 // thetaLength
                        ]}/>
                        <meshBasicMaterial color={[idx*0.125, idx*0.125, idx*0.125]}/>
                    </mesh>
                    <drei.Text
                        scale={15}
                        position={polar_to_cartesian(
                            (Math.PI * ((2*idx) + 4))/props.radialData.length,
                            radius + 16
                        )}
                    >{attr.name}</drei.Text>
                    </group>)
                })
            }
        </Canvas>
    </div>
    );
}

function polar_to_cartesian(
    angle: number,
    radius: number
): [number, number, number] {
    return [
        radius * Math.cos(angle),
        radius * Math.sin(angle),
        0
    ]
}