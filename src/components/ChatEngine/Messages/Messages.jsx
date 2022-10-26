import React, { useContext, useEffect, useState } from "react";
import { SidebarSearch, DisscussionMapComponents } from "../Sidebar/Sidebar";
import css from "./Messages.module.css";
import { messages as allMessages } from "../../../dummyData";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { General } from "../../../context/GeneralContext";
import Loader from "../../Loader/Loader";
import ServerError from "../../ServerError/ServerError";
import { io } from "socket.io-client";

const discussionSocket = io.connect("http://localhost:3002/discussion");

export const sendDiscussion = () => {
  discussionSocket.emit("new-discussion");
};

const Messages = () => {
  const navigate = useNavigate();
  const { status } = useParams();
  const [messages, setMessages] = useState([]);
  const [allMessages, setAllMessages] = useState([]);
  const general = useContext(General);
  const apiPrefix = general.domain;
  const config = general.config;
  const url = apiPrefix + `api/discussion`;
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectAll = async () => {
    setLoading(true);
    setError(false);

    const response = await axios.get(url, general.config).catch((e) => {
      setLoading(false);
      setError(true);
    });

    if (response) {
      const chatRooms = response?.data?.Data;

      if (chatRooms?.length > 0) {
        setMessages(chatRooms);
        setAllMessages(chatRooms);
      } else {
        setMessages([]);
        setAllMessages([]);
      }

      setLoading(false);
      setError(false);
    }
  };

  const refreshMessages = async () => {
    const response = await axios.get(url, general.config).catch((e) => {});

    if (response) {
      const chatRooms = response?.data?.Data;

      if (chatRooms?.length > 0) {
        setMessages(chatRooms);
      }
    }
  };

  const onSearchChangeHandler = (e) => {
    const currentValue = e?.target?.value;

    setMessages(
      allMessages.filter((eachMessage) =>
        eachMessage?.ChatRoomName?.toLowerCase()?.includes(
          currentValue?.toLowerCase()
        )
      )
    );
  };

  useEffect(() => {
    selectAll();
  }, []);

  useEffect(() => {
    discussionSocket.on("connection", (message) => {
      console.log(message);
    });

    discussionSocket.on("new-discussion", () => {
      console.log("There is a new discussion");
      refreshMessages();
    });
  }, [discussionSocket]);

  return (
    <div className={css.messages}>
      <div className={css.search}>
        <SidebarSearch
          icon="fa fa-search"
          actionIcon="fa-solid fa-user-plus"
          placeholder="Search for messages"
          all="All"
          active="Read"
          inActive="Unread"
          onAllClick={selectAll}
          onAllLink="/chat/messages/all"
          onActiveLink="/chat/messages/read"
          onInActiveLink="/chat/messages/unread"
          showOptions={false}
          onChange={onSearchChangeHandler}
        />
      </div>
      <div className={css.users}>
        {loading ? (
          <>
            <Loader />
          </>
        ) : error ? (
          <>
            <ServerError />
          </>
        ) : (
          <DisscussionMapComponents
            title="Messages"
            addUserIcon={false}
            profiles={messages}
            addMessagesCount={true}
            onClick={() => {}}
            onMediumClick={() => {
              navigate("/chat/platform");
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Messages;
