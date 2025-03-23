export default function TableRow(
    {data}: {data: any}
) {
    return (
        <tr>
            {data.map((item: any) => {
                return <td key={item}>{item}</td>;
            })}
        </tr>
    );
}