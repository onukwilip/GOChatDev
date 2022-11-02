import axios from "axios";
import React, { useEffect, useState } from "react";
import { useContext } from "react";
import { General } from "../../context/GeneralContext";
import { Button } from "../Button/Button";
import { emitMessage } from "../ChatEngine/ChatBlock/ChatBlock";
import { PostNotification } from "../ChatEngine/Notifications/Notifications";
import { Form, FormGroup } from "../Form/Form";
import Glassmorphism from "../Glassmorphism/Glassmorphism";
import css from "./Modal.module.css";
import { v4 as uuidV4 } from "uuid";
import { useNavigate } from "react-router-dom";

const RemoveFella = ({ items }) => {
  const general = useContext(General);
  const [password, setPassword] = useState("");
  const [error, setError] = useState({
    state: false,
    message: "",
  });
  const apiPrefix = general.domain;
  const config = general.config;
  const url = apiPrefix + `api/chatroom`;
  const [disabled, setDisabled] = useState(false);

  const blockFella = async () => {
    setDisabled(true);
    const ip = await axios
      .get("https://geolocation-db.com/json/")
      .catch((e) => {
        console.log(e);
      });

    const base64IP = general.toBase64(ip?.data?.IPv4);
    const base64Password = general.toBase64(password);

    const response = await axios
      .delete(
        `${url}/${items?.From_ID}/${items?.To_ID}/${base64IP}/${base64Password}/block`,
        { ...config }
      )
      .catch((e) => {
        setDisabled(false);
      });

    if (response) {
      let senderName;
      let receiverName;
      const sender = await axios
        .get(`${general.domain}api/user/${items?.From_ID}`)
        .catch();
      const receiver = await axios
        .get(`${general.domain}api/user/${items?.To_ID}`)
        .catch();

      for (var _user of sender?.data?.Data) {
        senderName = _user?.UserName;
      }

      for (var __user of receiver?.data?.Data) {
        receiverName = __user?.UserName;
      }

      const body = [
        {
          ID: 0,
          UserID: items?.From_ID,
          IdentityToRender: {
            IdentityToRenderID: items?.To_ID,
            IdentityToRenderName: null,
            IdentityToRenderProfilePicture: null,
            IsOnline: false,
          },
          Message: `You blocked ${receiverName}`,
          Type: "User",
          Target: "users",
          Viewed: false,
        },
        {
          ID: 0,
          UserID: items?.To_ID,
          IdentityToRender: {
            IdentityToRenderID: items?.From_ID,
            IdentityToRenderName: null,
            IdentityToRenderProfilePicture: null,
            IsOnline: false,
          },
          Message: `You have been blocked by ${senderName}`,
          Type: "User",
          Target: "users",
          Viewed: false,
        },
      ];
      general.postNotification(body);

      if (response.data.ResponseCode === 200) {
        setDisabled(false);

        setError({
          state: false,
          message: "",
        });

        general.setModalState("false");
        sessionStorage.setItem("modalState", "false");
        sessionStorage.removeItem("componentToRender");
      } else {
        setDisabled(false);

        setError({
          state: true,
          message: "Incorrect password!",
        });
      }
    } else {
      setDisabled(false);
    }

    console.log(response);
    general.setRefreshState((prev) => !prev);
  };

  return (
    <>
      <div className={css["remove-fella"]}>
        <p className={css.header}>
          Removing this fella will delete the chatroom you both share and all
          it's contents including it's members. Are you sure you wan't to go on
          with it, if yes input your password else just cancel
        </p>
        <Form>
          <FormGroup
            icon="fa fa-key"
            placeholder="Enter your password to continue"
            value={password}
            type="password"
            onChange={(e) => {
              setPassword(e.target.value);
            }}
          />
          {error.state && <p className="error">{error.message}</p>}

          <Button
            className={css["btn-danger"]}
            disabled={disabled}
            onClick={blockFella}
          >
            <i className="fa-solid fa-ban"></i>
            {disabled ? "Loading" : "Block Fella"}
          </Button>
        </Form>
      </div>
    </>
  );
};

const EditChat = ({ items }) => {
  const general = useContext(General);
  const [chatMessage, setChatMessage] = useState(items?.Message);
  const [error, setError] = useState({
    state: false,
    message: "",
  });
  const apiPrefix = general.domain;
  const config = general.config;
  const url = apiPrefix + `api/chats`;
  const [disabled, setDisabled] = useState(false);

  const sendChat = async () => {
    setDisabled(true);
    const response = await axios
      .put(
        `${url}`,
        {
          Message: chatMessage,
          ChatID: items?.ChatID,
        },
        { ...config }
      )
      .catch((e) => {
        setError({ state: true, message: "Network error" });
        setDisabled(false);
      });

    if (response) {
      setDisabled(false);
      emitMessage(items);

      general.setUpdateChat((prev) => ({
        ...prev,
        state: !prev.state,
        details: {
          ChatID: items?.ChatID,
          Message: chatMessage,
        },
      }));

      general.setModalState("false");
      sessionStorage.setItem("modalState", "false");
      sessionStorage.removeItem("componentToRender");
    }
  };

  return (
    <>
      <div className={css["edit-chat"]}>
        <Form className={css.form}>
          <FormGroup
            icon="fa-solid fa-face-smile"
            placeholder="Enter your message"
            value={chatMessage}
            type="text"
            onChange={(e) => {
              setChatMessage(e.target.value);
            }}
          />
          <Button onClick={sendChat} className={css.send} disabled={disabled}>
            <i className="fa-solid fa-paper-plane"></i>
            {disabled ? "Updating..." : "Update Message"}
          </Button>
        </Form>
        {error.state && (
          <em style={{ fontStyle: "normal" }} className="error">
            {error.message}
          </em>
        )}
      </div>
    </>
  );
};

const NewGroup = () => {
  const general = useContext(General);
  const navigate = useNavigate();
  const url = `${general.domain}api/chatroom`;
  const [src, setSrc] = useState("");
  const [userDetailsDisabled, setUserDetailsDisabled] = useState(false);
  const [accountDetails, setAccountDetails] = useState({
    ChatRoomName: "",
    Description: "",
    ProfilePicture: "",
  });
  const [error, setError] = useState({
    state: false,
    message: "",
  });

  const fileOnChangeHandler = (e) => {
    setAccountDetails((prev) => ({
      ...prev,
      ProfilePicture: e.target.files[0],
    }));
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (arg) => {
      setSrc(arg.target.result);
    };

    reader.readAsDataURL(file);
  };

  const submitDetails = async (chatroom) => {
    const response = await axios
      .post(
        url,
        {
          ChatRoomID: chatroom?.chatRoomID,
          ChatRoomName: chatroom?.chatRoomName,
          Description: chatroom?.description,
        },
        general.config
      )
      .catch((e) => {});

    return response;
  };

  const submitImage = async (chatroomid) => {
    const config = {
      headers: {
        ...general.config.headers,
        "Content-type": "multipart/form-data",
      },
    };

    const formData = new FormData();

    formData.append("body", accountDetails.ProfilePicture);

    const response = await axios
      .put(`${url}/${chatroomid}`, formData, config)
      .catch((e) => {});

    return response;
  };

  const onSubmitHandler = async () => {
    setUserDetailsDisabled(true);

    const chatroomId = `CHATROOM_${uuidV4()}`;
    const chatroom = {
      chatRoomID: chatroomId,
      chatRoomName: accountDetails.ChatRoomName,
      description: accountDetails.Description,
    };
    const detailsResponse = await submitDetails(chatroom).catch((e) => {
      setUserDetailsDisabled(false);
      setError({
        state: true,
        message: "There was an error creating your group, please try again",
      });
    });

    if (detailsResponse.data?.ResponseCode === 200) {
      // console.log("I got here and the details response code is 200");
      if (
        accountDetails.ProfilePicture !== null &&
        accountDetails.ProfilePicture !== "" &&
        accountDetails.ProfilePicture !== undefined
      ) {
        const imageResponse = await submitImage(chatroom.chatRoomID).catch(
          (e) => {
            setUserDetailsDisabled(false);
            // console.log(
            //   "I got here and there is an issue in uploading the image"
            // );
          }
        );
        if (imageResponse) {
          setUserDetailsDisabled(false);
          // console.log("I got here, details and image uploaded successfully");
        }
        setError({
          state: false,
          message: "",
        });
        //NAVIGATE TO GROUP DETAILS AND CLOSE MODAL
        general.setModalState("false");
        sessionStorage.setItem("modalState", "false");
        sessionStorage.removeItem("componentToRender");
        navigate(`chat/group/${chatroom.chatRoomID}`);
      } else {
        // console.log(
        //   "I got here and the details response code is not " +
        //     200 +
        //     " but is" +
        //     detailsResponse?.data?.ResponseCode
        // );

        setUserDetailsDisabled(false);

        setError({
          state: false,
          message: "",
        });
        //NAVIGATE TO GROUP DETAILS AND CLOSE MODAL
        general.setModalState("false");
        sessionStorage.setItem("modalState", "false");
        sessionStorage.removeItem("componentToRender");
        navigate(`chat/group/${chatroom.chatRoomID}`);
      }
    } else {
      setUserDetailsDisabled(false);
      setError({
        state: true,
        message: "There was an error creating your group, please try again",
      });
    }
  };

  return (
    <Form className={css["new-group"]} onSubmit={onSubmitHandler}>
      {accountDetails.ProfilePicture === undefined ||
      accountDetails.ProfilePicture === "" ||
      accountDetails.ProfilePicture === null ? (
        <label className={css["img-upload"]}>
          <input type="file" hidden onChange={fileOnChangeHandler} />
          <div>
            <i className="fa-solid fa-cloud-arrow-up"></i>
          </div>
          <h3>Upload group picture</h3>
        </label>
      ) : (
        <div className={css["img-container"]}>
          <img src={src} alt="" />
          <label>
            <input type="file" hidden onChange={fileOnChangeHandler} />
            <i className="fa fa-pencil"></i>
          </label>
        </div>
      )}

      <FormGroup
        icon="fa fa-user"
        value={accountDetails.ChatRoomName}
        onChange={(e) => {
          setAccountDetails((prev) => ({
            ...prev,
            ChatRoomName: e.target.value,
          }));
        }}
        placeholder="Enter group name..."
        disabled={userDetailsDisabled}
        required={true}
      />
      <Button disabled={userDetailsDisabled}>
        {userDetailsDisabled ? "Creating..." : "Create"}
      </Button>
    </Form>
  );
};

const InviteMembers = ({ items }) => {
  return (
    <div className={css.invite}>
      <div className={css.options}>
        <label htmlFor="fellasOnly">
          Fella's only(Display only a list of users in which you are fella's
          with) :
          <div className={css.switch}>
            <input
              type="radio"
              name="selecType"
              value={"fellasOnly"}
              id="fellasOnly"
            />
            <span className={`${css.slider} ${css.round}`}></span>
          </div>
        </label>
        <label htmlFor="allUsers">
          All users(Display a list of random users which are not members of this
          group) :
          <div className={css.switch}>
            <input
              type="radio"
              name="selecType"
              value={"allUsers"}
              id="allUsers"
            />
            <span className={`${css.slider} ${css.round}`}></span>
          </div>
        </label>
      </div>
      Invite new members {items?.groupid}
    </div>
  );
};

const Modal = () => {
  const general = useContext(General);
  const [componentToRender, setComponentToRender] = useState({
    ...JSON.parse(sessionStorage.getItem("componentToRender")),
  });

  useEffect(() => {
    setComponentToRender({
      ...JSON.parse(sessionStorage.getItem("componentToRender")),
    });
    return () => {};
  }, [general.refreshState]);

  return (
    <>
      <div className={css.modal}>
        <div
          className={css.bg}
          onClick={() => {
            general.setModalState("false");
            sessionStorage.setItem("modalState", "false");
            sessionStorage.removeItem("componentToRender");
          }}
        ></div>
        <Glassmorphism className={css.body}>
          {componentToRender.component === "RemoveFella" && (
            <>
              <RemoveFella items={componentToRender.values} />
            </>
          )}
          {componentToRender.component === "EditChat" && (
            <>
              <EditChat items={componentToRender.values} />
            </>
          )}
          {componentToRender.component === "newGroup" && (
            <>
              <NewGroup />
            </>
          )}
          {componentToRender.component === "invite" && (
            <>
              <InviteMembers items={componentToRender.values} />
            </>
          )}
        </Glassmorphism>
      </div>
    </>
  );
};

export default Modal;
