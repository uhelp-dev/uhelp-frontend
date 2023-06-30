"use client";
import Modal from "./Modal";
import styles from "@/app/styles/Forum.module.scss";
import Button from "../../Button";
import { useAppSelector } from "@/redux/store";
import {
  addPost,
  addReply,
  deleteItem,
  editItem,
} from "@/app/(Forum)/forum/[channelID]/helper";
import {
  setIsOpen,
  setPostContentInput,
  setPostTitleInput,
} from "@/redux/slices/forumSlice";
import { useDispatch } from "react-redux";
import useSubmitShortcut from "@/hooks/useShortcuts";
import { useEffect, useState } from "react";

const ForumModal = () => {
  const dispatch = useDispatch();
  const isOpen = useAppSelector((state) => state.forum.isOpen);
  const error = useAppSelector((state) => state.forum.error);
  const modalType = useAppSelector((state) => state.forum.modalType);
  const postID = useAppSelector((state) => state.forum.postID);
  const replyID = useAppSelector((state) => state.forum.replyID);
  const actionType = useAppSelector((state) => state.forum.action);
  const postTitleInput = useAppSelector((state) => state.forum.postTitleInput);
  const postContentInput = useAppSelector(
    (state) => state.forum.postContentInput
  );
  const [lastOpenedModal, setLastOpenedModal] = useState(modalType);

  useEffect(() => {
    if (
      lastOpenedModal !== modalType &&
      modalType !== "Edit" &&
      modalType !== "Delete"
    ) {
      dispatch(setPostTitleInput(""));
      dispatch(setPostContentInput(""));
    }
    if (modalType !== "Delete") setLastOpenedModal(modalType);
  }, [modalType]);

  const handleSubmit = () => {
    const isReply = actionType === "reply";
    switch (modalType) {
      case "Post":
        addPost();
        break;
      case "Reply":
        addReply(postID, replyID);
        break;
      case "Edit":
        editItem(isReply ? replyID : postID, isReply);
        break;
      case "Delete":
        deleteItem(isReply ? replyID : postID, isReply);
        break;
      default:
        break;
    }
  };

  const title = () => {
    switch (modalType) {
      case "Post":
        return "New Post";
      case "Reply":
        return "New Reply";
      case "Edit":
        return `Edit ${actionType}`;
      case "Delete":
        return `Delete ${actionType}`;
      default:
        return "";
    }
  };

  const buttonText = () => {
    switch (modalType) {
      case "Post":
        return "Add Post";
      case "Reply":
        return "Reply";
      case "Edit":
        return "Update";
      case "Delete":
        return "Confirm";
      default:
        return "";
    }
  };

  useSubmitShortcut(handleSubmit, isOpen);
  return (
    <Modal
      status={isOpen}
      handleClose={() => dispatch(setIsOpen(false))}
      title={title()}
      className={modalType === "Delete" ? styles.small : ""}>
      <div className={styles.modalBodyWrapper}>
        <div className={styles.modalBody}>
          <div className={styles.modalForm}>
            {modalType === "Post" && (
              <>
                <label className={styles.modalLabel}>
                  Post Title
                  <input
                    type="text"
                    value={postTitleInput}
                    autoFocus
                    onChange={(e) => {
                      dispatch(setPostTitleInput(e.target.value));
                    }}
                  />
                </label>
                <label className={styles.modalLabel}>
                  Post Content
                  <textarea
                    value={postContentInput}
                    onChange={(e) => {
                      dispatch(setPostContentInput(e.target.value));
                    }}
                  />
                </label>
              </>
            )}
            {modalType === "Reply" && (
              <>
                <label className={styles.modalLabel}>
                  Reply Content
                  <textarea
                    value={postContentInput}
                    autoFocus
                    onChange={(e) => {
                      dispatch(setPostContentInput(e.target.value));
                    }}
                  />
                </label>
              </>
            )}
            {modalType === "Edit" && (
              <>
                {actionType === "post" && (
                  <label className={styles.modalLabel}>
                    Post Title
                    <input
                      type="text"
                      value={postTitleInput}
                      onChange={(e) => {
                        dispatch(setPostTitleInput(e.target.value));
                      }}
                    />
                  </label>
                )}
                <label className={styles.modalLabel}>
                  {actionType === "post" ? "Post Content" : "Reply Content"}
                  <textarea
                    value={postContentInput}
                    onChange={(e) => {
                      dispatch(setPostContentInput(e.target.value));
                    }}
                  />
                </label>
              </>
            )}
          </div>
          {modalType === "Delete" && (
            <p>{`Are you sure you want to permanently delete this ${
              actionType === "post" ? "post" : "reply"
            }?`}</p>
          )}
          <div className="centerRow">
            {error && <p className={styles.error}>{error}</p>}
          </div>
        </div>
        <div className={styles.modalFooter}>
          <Button
            secondary
            sm
            onClick={handleSubmit}
            label={buttonText()}></Button>
        </div>
      </div>
    </Modal>
  );
};

export default ForumModal;
