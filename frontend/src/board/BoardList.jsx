import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  Center,
  Flex,
  Heading,
  Input,
  Select,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart as fullHeart,
  faImage,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";

export function BoardList() {
  const [boardList, setBoardList] = useState([]);
  const [pageInfo, setPageInfo] = useState({});
  const [searchType, setSearchType] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const typeParam = searchParams.get("type");
    const keywordParam = searchParams.get("keyword");
    if (typeParam) {
      setSearchType(typeParam);
    }
    if (keywordParam) {
      setSearchKeyword(keywordParam);
    }

    axios.get(`/api/board/list?${searchParams}`).then((res) => {
      setBoardList(res.data.boardList);
      setPageInfo(res.data.pageInfo);
    });
  }, [searchParams]);

  const pageNumbers = [];
  for (let i = pageInfo.leftPageNumber; i <= pageInfo.rightPageNumber; i++) {
    pageNumbers.push(i);
  }

  function handlePageButtonClick(pageNumber) {
    searchParams.set("page", pageNumber);
    navigate(`/board/list/?${searchParams}`);
  }

  function handleSearchButtonClick() {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("type", searchType);
    newParams.set("keyword", searchKeyword);
    newParams.set("page", 1); // 검색 시 첫 페이지로 이동
    navigate(`/board/list/?${newParams.toString()}`);
  }

  return (
    <Box>
      <Box>
        <Heading>자유게시판 목록</Heading>
      </Box>
      <Box>
        <Table>
          <Thead>
            <Tr>
              <Th>No.</Th>
              <Th>제목</Th>
              <Th>작성자</Th>
              <Th>작성시간</Th>
            </Tr>
          </Thead>
          <Tbody>
            {boardList.map((board) => (
              <Tr onClick={() => navigate(`/board/${board.id}`)} key={board.id}>
                <Td>{board.id}</Td>
                <Td>
                  {board.title}
                  {board.numberOfImages > 0 && (
                    <Badge>
                      <Flex>
                        <Box>
                          <FontAwesomeIcon icon={faImage} />
                        </Box>
                        <Box>{board.numberOfImages}</Box>
                      </Flex>
                    </Badge>
                  )}
                  {board.numberOfLikes > 0 && (
                    <Badge>
                      <Flex>
                        <Box>
                          <FontAwesomeIcon icon={fullHeart} />
                        </Box>
                        <Box>{board.numberOfLikes}</Box>
                      </Flex>
                    </Badge>
                  )}
                </Td>
                <Td>{board.userId}</Td>
                <Td>{board.inserted}</Td>
                <Td hidden>{board.content}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
      <Center>
        <Flex>
          <Select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
          >
            <option value={"all"}>전체</option>
            <option value={"content"}>내용</option>
            <option value={"title"}>제목</option>
          </Select>
          <Input
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
          <Button onClick={handleSearchButtonClick}>
            <FontAwesomeIcon icon={faMagnifyingGlass} />
          </Button>
        </Flex>
      </Center>
      <Center>
        {pageNumbers.map((pageNumber) => (
          <ButtonGroup
            key={pageNumber}
            onClick={() => handlePageButtonClick(pageNumber)}
          >
            <Button>{pageNumber}</Button>
          </ButtonGroup>
        ))}
      </Center>
    </Box>
  );
}
