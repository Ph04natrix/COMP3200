import TableHeadItem from "./TableHeadItem";
import TableRow from "./TableRow";

export default function Table(
    {theadData, tbodyData}: {theadData: [string], tbodyData: [[string]]}
) {

    return(<>
    <table className="">
            <thead>
                <tr>
                    {theadData.map((h) => {
                        return <TableHeadItem key={h} item={h} />;
                    })}
                </tr>
            </thead>
            <tbody>
                {tbodyData.map((item) => {
                    return <TableRow key={"todo"} data={item} />;
                })}
            </tbody>
        </table>
    </>)
}