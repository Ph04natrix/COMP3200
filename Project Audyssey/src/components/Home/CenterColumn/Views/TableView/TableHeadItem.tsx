export default function TableHeadItem(
    {item}: {item: any}
) {
    return (
        <td title={item}>
            {item}
        </td>
    );
}