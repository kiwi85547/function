import {
  Box,
  Button,
  Center,
  Flex,
  Input,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import * as StompJs from "@stomp/stompjs";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { LoginContext } from "../component/LoginProvider.jsx";
import { ProductStateComp } from "./chatComponent/ProductStateComp.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleLeft } from "@fortawesome/free-solid-svg-icons";

const ChatRoomDeleteComp = () => {
  return (
    <>
      <Button colorScheme={"yellow"}>채팅삭제</Button>
    </>
  );
};

export function ChatRoom() {
  const { productId } = useParams();
  const account = useContext(LoginContext);
  // const chatroomId = param.chatroomId;
  // const [chatList, setChatList] = useState([]); // 채팅 리스트
  const [roomInfo, setRoomInfo] = useState(null);
  const [productInfo, setProductInfo] = useState(null);
  const [roomId, setRoomId] = useState(null);
  // const [chat, setChat] = useState(""); // 입력된 채팅 내용
  // -- GPT
  const [stompClient, setStompClient] = useState(null);
  const [message, setMessage] = useState(""); // 입력된 채팅 내용
  const [messages, setMessages] = useState([]); // 채팅 리스트
  const navigate = useNavigate();
  // -- axios.get
  useEffect(() => {
    axios
      .get(`/api/chat/${productId}`)
      .then((res) => {
        setRoomInfo(res.data.chatRoom);
        setProductInfo(res.data.chatProduct);
        setRoomId(res.data.chatRoom.id);
        if (!res.data.firstChat) {
          setMessages(res.data.messageList);
        }
      })
      .catch()
      .finally();
  }, []);

  console.log("roomId : ", roomId);

  // -- stomp
  useEffect(() => {
    console.log("roomId2 : ", roomId);
    const client = new StompJs.Client({
      brokerURL: "ws://localhost:8080/ws",
      // connectHeaders: {
      //   login: "user",
      //   passcode: "password",
      // },
      debug: function (str) {
        console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 30 * 1000,
      heartbeatOutgoing: 30 * 1000,
      onConnect: function () {
        console.log("Connected to WebSocket");
        client.subscribe(`/user/queue/chat`, callback, { ack: "client" }); // 상대방
        client.subscribe(`/topic/chat/${roomId}`, callback, {
          ack: "client",
        }); // 본인
      },
      onStompError: (frame) => {
        console.error("STOMP error: ", frame);
      },
    });

    client.activate(); // 활성화
    setStompClient(client);

    return () => {
      if (stompClient) {
        disConnect();
      }
    };
  }, [roomId]);

  const callback = (message) => {
    const receivedMessage = JSON.parse(message.body);
    setMessages((prevMessages) => [...prevMessages, receivedMessage]);
    message.ack();
  };

  const sendMessage = () => {
    let chatMessage = {
      chatRoomId: roomInfo.id,
      userId: account.id,
      message: message,
    };
    stompClient.publish({
      destination: `/app/chat`,
      body: JSON.stringify(chatMessage),
    });

    // -- 내가 보낸 거
    let formattedMessage = chatMessage;
    setMessages((prevMessages) => [...prevMessages, formattedMessage]);
    setMessage("");
  };

  // -- 비활성화
  const disConnect = () => {
    stompClient.deactivate();
    console.log("Disconnected");
  };

  // spinner
  if (roomInfo == null) {
    return <Spinner />;
  }

  return (
    <Box>
      <Box>
        <Button
          onClick={() => {
            disConnect();
            navigate(-1);
          }}
        >
          {/* 뒤로 가기 */}
          <FontAwesomeIcon icon={faAngleLeft} />
        </Button>
      </Box>
      <Box cursor={"pointer"}>
        {/* 상대방 상점 */}
        <Center fontSize={"xl"}>
          {roomInfo.sellerId === Number(account.id) ? (
            <Text onClick={() => navigate(`/shop/${roomInfo.userId}/products`)}>
              {roomInfo.userName}
            </Text>
          ) : (
            <Text
              onClick={() => navigate(`/shop/${roomInfo.sellerId}/products`)}
            >
              {roomInfo.sellerName}
            </Text>
          )}
        </Center>
      </Box>
      <Box>
        <Flex>
          <Box cursor={"pointer"}>
            <Text onClick={() => navigate(`/product/${productInfo.id}`)}>
              {productInfo.title}
            </Text>
          </Box>
          <Button></Button>
        </Flex>
        <Flex>
          <ProductStateComp
            productInfo={productInfo}
            userId={`${account.id}`}
          />
          <Button>채팅삭제</Button>
        </Flex>
      </Box>
      <Box>
        <Box>
          <Box>
            {messages.map((msg, index) => (
              <Box key={index}>
                <Flex>
                  <Text>
                    {/* 변수의 형식까지 비교하기 위해 account.id 문자열을 숫자로 변경 */}
                    {msg.userId === Number(account.id) ? (
                      <>{roomInfo.userName}</>
                    ) : (
                      <>{roomInfo.sellerName}</>
                    )}
                  </Text>
                  <Text> : {msg.message}</Text>
                </Flex>
                <Text fontSize={"xs"}>{msg.inserted}</Text>
              </Box>
            ))}
          </Box>
          <Box>
            <Flex>
              <Input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button
                isDisabled={message.trim().length === 0}
                onClick={sendMessage}
              >
                send
              </Button>
            </Flex>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
