import React, { useContext, useEffect, useState } from "react";
import { SidebarSearch, NotificationMapComponents } from "../Sidebar/Sidebar";
import css from "./Notifications.module.css";
import { messages as allNotifications } from "../../../dummyData";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { General } from "../../../context/GeneralContext";
import Loader from "../../Loader/Loader";
import ServerError from "../../ServerError/ServerError";

export const PostNotification = async (body) => {
  const general = useContext(General);

  const url = `${general.domain}api/notification`;
  const config = { ...general.config };

  const response = await axios.post(url, body, config).catch();

  console.log(response?.data);
  console.log("Notification sent successfully");
};

const Notifications = () => {
  const navigate = useNavigate();
  const { status } = useParams();
  const [notifications, setNotifications] = useState([]);
  const [allNotifications, setAllNotifications] = useState([]);
  const general = useContext(General);
  const apiPrefix = general.domain;
  const config = general.config;
  const url = apiPrefix + `api/notification`;
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const getNotifications = () => {
    if (status === "all") {
      selectAll();
    } else if (status === "read") {
      selectRead();
    } else if (status === "unread") {
      selectUnread();
    } else {
      selectAll();
    }
  };

  const selectAll = async () => {
    // setNotifications(allNotifications);
    setLoading(true);
    setError(false);

    const response = await axios.get(url, general.config).catch((e) => {
      setLoading(false);
      setError(true);
    });

    if (response) {
      const _notifications = response?.data?.Data;

      if (_notifications?.length > 0) {
        setNotifications(_notifications);
        setAllNotifications(_notifications);
      } else {
        setAllNotifications([]);
        setNotifications([]);
      }

      setLoading(false);
      setError(false);
    }
  };

  const selectRead = () => {
    setNotifications(
      allNotifications.filter((notification) => notification?.Viewed === true)
    );
  };

  const selectUnread = () => {
    setNotifications(
      allNotifications.filter((notification) => notification?.Viewed === false)
    );
  };

  const onSearchChangeHandler = (e) => {
    const currentValue = e?.target?.value;

    if (e?.target?.value === null || e?.target?.value === "") {
      if (status === "all") {
        selectAll();
      } else if (status === "read") {
        selectRead();
      } else if (status === "unread") {
        selectUnread();
      } else {
        selectAll();
      }
    } else {
      if (status === "all") {
        setNotifications(
          allNotifications.filter((eachNotification) =>
            eachNotification.IdentityToRender?.IdentityToRenderName?.toLowerCase()?.includes(
              currentValue?.toLowerCase()
            )
          )
        );
      } else if (status === "read") {
        const readNotifications = allNotifications.filter(
          (notification) => notification?.Viewed === true
        );

        setNotifications(
          readNotifications.filter((notification) =>
            notification.IdentityToRender?.IdentityToRenderName?.toLowerCase()?.includes(
              currentValue?.toLowerCase()
            )
          )
        );
      } else if (status === "unread") {
        const unReadNotifications = allNotifications.filter(
          (notification) => notification?.Viewed === false
        );

        setNotifications(
          unReadNotifications.filter((notification) =>
            notification.IdentityToRender?.IdentityToRenderName?.toLowerCase()?.includes(
              currentValue?.toLowerCase()
            )
          )
        );
      } else {
        setNotifications(
          allNotifications.filter((eachNotification) =>
            eachNotification.IdentityToRender?.IdentityToRenderName?.toLowerCase()?.includes(
              currentValue?.toLowerCase()
            )
          )
        );
      }

      // console.log(e?.target?.value);
    }
  };

  useEffect(() => {
    getNotifications();
  }, []);

  return (
    <div className={css.messages}>
      <div className={css.search}>
        <SidebarSearch
          icon="fa fa-search"
          actionIcon="fa-solid fa-user-plus"
          placeholder="Search all notifications"
          all="All"
          active="Read"
          inActive="Unread"
          onAllClick={selectAll}
          onActiveClick={selectRead}
          onInActiveClick={selectUnread}
          onAllLink="/chat/notifications/all"
          onActiveLink="/chat/notifications/read"
          onInActiveLink="/chat/notifications/unread"
          showOptions={true}
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
          <NotificationMapComponents
            title="Notifications"
            addUserIcon={false}
            profiles={notifications}
            addMessagesCount={false}
            setStates={[setNotifications, setAllNotifications]}
            addDeleteIcon={true}
          />
        )}
      </div>
    </div>
  );
};

export default Notifications;
