import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  Tfoot,
  VStack,
  Text,
  Box,
  useBreakpointValue,
  IconButton,
  CSSObject,
  useColorModeValue,
  Icon,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiMoreHorizontal, FiTrash } from "react-icons/fi";
import { useTable, useSortBy, Column } from "react-table";
import {
  ContextMenuItem,
  ContextMenuList,
  ContextMenuTrigger,
  useContextTrigger,
} from "../context-menu";
import { useStoreActions } from "../../store";
import { PlaylistSongTableDropDownMenu } from "./SongTableDropdownButton";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { useClipboardWithToast } from "../../modules/common/clipboard";
import { useNavigate } from "react-router";
import {
  DragDropContext,
  Draggable,
  DraggableProvided,
  DraggableStateSnapshot,
  Droppable,
  DroppableProvided,
  DropResult,
} from "react-beautiful-dnd";

type IndexedSong = Song & { idx: number };
interface SongEditableTableProps {
  songs: Song[];
  songsEdited: (songIds: number[]) => void;
}

export const SongEditableTable = ({
  songs,
  songsEdited,
}: SongEditableTableProps) => {
  const { t } = useTranslation();
  const [newSongIds, setNewSongIds] = useState(() => songs.map((x) => x.id));
  const s: IndexedSong[] = useMemo(() => {
    return newSongIds.map((id, idx) => {
      return {
        ...songs.find((x) => x.id === id)!,
        idx,
      };
    });
  }, [newSongIds, songs]);
  const columns: Column<IndexedSong>[] = useMemo<Column<IndexedSong>[]>(
    () => [
      {
        Header: "#",
        accessor: "idx",
        maxWidth: 40,
      },
      {
        Header: "Title",
        accessor: "name",
        Cell: (cellInfo: any) => {
          // console.log(cellInfo);
          return (
            <VStack alignItems="start" spacing={1}>
              <span>{cellInfo.row.original?.name}</span>
              <Text color="whiteAlpha.600" fontWeight={300} fontSize="sm">
                {cellInfo.row.original.channel?.name}
              </Text>
            </VStack>
          );
        },
      },
      {
        id: "channel",
        Header: "ChannelName",
        accessor: (row: IndexedSong) =>
          row.channel?.english_name || row.channel?.name,
      },
      {
        Header: "Original Artist",
        accessor: "original_artist",
      },
      {
        id: "dur",
        Header: "Duration",
        accessor: (row: { end: number; start: number }) => {
          return row.end - row.start;
        },
        isNumeric: true,
      },
      {
        id: "date",
        Header: "Sang On",
        accessor: (row: { available_at: Date }) =>
          t("relativeDate", { date: new Date(row?.available_at) }),
      },
      {
        id: "...",
        Header: "",
        disableSortBy: true,
        accessor: "idx",
        Cell: (cellInfo: any) => {
          // console.log(cellInfo);
          return (
            <IconButton
              variant="outline"
              aria-label="delete"
              colorScheme="red"
              icon={<FiTrash />}
            />
          );
        },
      },
    ],
    [t]
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    toggleHideColumn,
  } = useTable(
    {
      columns: columns as any,
      data: s,
      initialState: { hiddenColumns: ["channel"] },
      disableSortBy: true,
      //   getRowId: (or, idx) => idx.toString(),
    },
    useSortBy
  );

  const isXL = useBreakpointValue({ base: false, xl: true });

  useEffect(() => {
    toggleHideColumn("original_artist", !isXL);
    toggleHideColumn("duration", !isXL);
    // toggleHideColumn("idx", !isXL);
  }, [isXL, toggleHideColumn]);

  const HOVER_ROW_STYLE: CSSObject = {
    backgroundColor: useColorModeValue("bgAlpha.200", "bgAlpha.800"),
  };

  const moveRow = (dragIndex: number, hoverIndex: number) => {
    // console.log(dragIndex, hoverIndex);
    const arrayAroundDragged = [
      ...newSongIds.slice(0, dragIndex),
      ...newSongIds.slice(dragIndex + 1),
    ];
    arrayAroundDragged.splice(hoverIndex, 0, newSongIds[dragIndex]);
    setNewSongIds(arrayAroundDragged);
  };

  const onDragEnd = (result: DropResult) => {
    // dropped outside the list
    if (
      !result.destination ||
      result.destination.index === result.source.index
    ) {
      return;
    }

    // no movement
    if (result.destination.index === result.source.index) {
      return;
    }

    moveRow(result.source.index, result.destination.index);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Table {...getTableProps()} size={isXL ? "md" : "sm"}>
        <Thead>
          {headerGroups.map((headerGroup) => (
            <Tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <Th
                  {...column.getHeaderProps(column.getSortByToggleProps())}
                  isNumeric={(column as any).isNumeric}
                >
                  {column.isSorted &&
                    (column.isSortedDesc ? (
                      <Icon as={FaChevronDown} display="inline" mr="2" />
                    ) : (
                      <Icon as={FaChevronUp} display="inline" mr="2" />
                    ))}
                  {column.render("Header")}
                </Th>
              ))}
            </Tr>
          ))}
        </Thead>
        <Droppable droppableId="table">
          {(droppableProvided: DroppableProvided) => (
            <Tbody
              {...getTableBodyProps()}
              {...droppableProvided.droppableProps}
              ref={(ref: HTMLElement | null) => {
                droppableProvided.innerRef(ref);
              }}
            >
              {rows.map((row, index) => {
                prepareRow(row);
                return (
                  <Draggable
                    draggableId={"d" + row.original.idx}
                    index={index}
                    key={"dk" + row.original.idx}
                  >
                    {(
                      provided: DraggableProvided,
                      snapshot: DraggableStateSnapshot
                    ) => (
                      <Tr
                        {...row.getRowProps()}
                        _hover={HOVER_ROW_STYLE}
                        ref={provided.innerRef}
                        isDragging={snapshot.isDragging}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        {row.cells.map(
                          (cell) =>
                            !(
                              snapshot.isDragging &&
                              cell.column.id !== "name" &&
                              cell.column.id !== "idx"
                            ) && (
                              <Td
                                {...cell.getCellProps()}
                                isNumeric={(cell.column as any).isNumeric}
                                {...{
                                  width:
                                    cell.column.id === "idx" ? "40px" : "auto",
                                }}
                                {...(snapshot.isDragging && {
                                  width:
                                    cell.column.id === "idx" ? "40px" : "100vw",
                                })}
                              >
                                {cell.render("Cell")}
                              </Td>
                            )
                        )}
                      </Tr>
                    )}
                  </Draggable>
                );
              })}
            </Tbody>
          )}
        </Droppable>
      </Table>
    </DragDropContext>
  );
};
