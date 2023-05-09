"use client";
import React from "react";
import styles from "@/app/styles/Forum.module.scss";
import Modal from "@/app/components/Forum/Modal/Modal";
import Button from "@/app/components/Button";
import useSWR from "swr";
import useSWRImmutable from "swr/immutable";
import { IoTrash } from "react-icons/io5";
import { AiFillLike } from "react-icons/ai";
import { MdReply, MdModeEdit } from "react-icons/md";
import { FaUserAlt } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/redux/store";
import {
  setChannelName,
  setChannelDescription,
} from "@/redux/slices/channelSlice";
import { Post, Reply } from "@/utils/Types";
import { postAnimation } from "@/utils/Animations";
import {
  setIsPostModalOpen,
  setIsReplyModalOpen,
  setIsEditModalOpen,
  setIsDeleteModalOpen,
  setPostID,
  setReplyID,
  setAction,
  setPostTitleInput,
  setPostContentInput,
  setError,
} from "@/redux/slices/forumSlice";
import { zeroRightClassName } from "react-remove-scroll-bar";
import { MdPostAdd } from "react-icons/md";
import Account from "@/app/components/Navbar/Account";
import Skeleton from "@/app/components/Forum/Skeleton";
import { useSession } from "next-auth/react";
import Sidebar from "@/app/components/Forum/Sidebar/Sidebar";

function Forum() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const channelID = usePathname()?.split("/")[2];

  const dispatch = useAppDispatch();
  const isMobile = useAppSelector((state) => state.app.isMobile);
  const username = session?.user?.username;
  const channelName = useAppSelector((state) => state.channel.channelName);
  const channelDescription = useAppSelector(
    (state) => state.channel.channelDescription
  );

  // Modal states
  const isPostModalOpen = useAppSelector(
    (state) => state.forum.isPostModalOpen
  );
  const isReplyModalOpen = useAppSelector(
    (state) => state.forum.isReplyModalOpen
  );
  const isEditModalOpen = useAppSelector(
    (state) => state.forum.isEditModalOpen
  );
  const isDeleteModalOpen = useAppSelector(
    (state) => state.forum.isDeleteModalOpen
  );

  const postID = useAppSelector((state) => state.forum.postID);
  const replyID = useAppSelector((state) => state.forum.replyID);
  const actionType = useAppSelector((state) => state.forum.action);
  const postTitleInput = useAppSelector((state) => state.forum.postTitleInput);
  const postContentInput = useAppSelector(
    (state) => state.forum.postContentInput
  );
  const error = useAppSelector((state) => state.forum.error);

  const authHeader = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + session?.user.access_token,
  };
  const postsApiUrl = `/uhelp-api/channel/${channelID}/posts`;

  const channelFetcher = async (url: string) => {
    if (!channelID || !session) return;

    const res = await fetch(url, { method: "GET", headers: authHeader });
    const data = await res.json();

    if (channelName !== data.name) dispatch(setChannelName(data.name));
    if (channelDescription !== data.description)
      dispatch(setChannelDescription(data.description));
  };

  React.useEffect(() => {
    fetchChannel();
    fetchPosts();
  }, [status]);

  const { mutate: fetchChannel } = useSWRImmutable(
    `/uhelp-api/channel/${channelID}`,
    channelFetcher
  );

  const postsFetcher = async (url: string): Promise<Post[]> => {
    if (!channelID || !session) return [];

    const res = await fetch(url, { method: "GET", headers: authHeader });
    const data = await res.json();

    if (res.status === 401) {
      router.push("/signin");
      return [];
    }

    return data;
  };

  const {
    data: posts,
    mutate: fetchPosts,
    isLoading,
  } = useSWR<Post[]>(postsApiUrl, postsFetcher, {
    refreshInterval: 20000,
    refreshWhenHidden: false,
    refreshWhenOffline: false,
  });

  const handleResponse = (data: any, setError: Function, mutate: Function) =>
    data.error ? setError(data.error) : mutate();

  const checkInput = (title: string, content: string) =>
    title === ""
      ? "Title cannot be empty"
      : content === ""
      ? "Content cannot be empty"
      : null;

  const addPost = () => {
    const error = checkInput(postTitleInput, postContentInput);
    if (error) {
      dispatch(setError(error));
      return;
    }

    fetch("/uhelp-api/post/new", {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        title: postTitleInput,
        content: postContentInput,
        channel_id: channelID,
      }),
    })
      .then((res) => res.json())
      .then(({ error }) => {
        handleResponse({ error }, setError, fetchPosts);
        dispatch(setIsPostModalOpen(false));
        dispatch(setPostTitleInput(""));
        dispatch(setPostContentInput(""));
      })
      .catch(console.error);
  };

  const addReply = (id: number, parent_id: number | null) => {
    if (postContentInput === "") {
      dispatch(setError("Reply cannot be empty"));
      return;
    }

    fetch(`/uhelp-api/post/${id}/reply`, {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        content: postContentInput,
        post_id: id,
        parent_reply_id: parent_id,
      }),
    })
      .then((res) => res.json())
      .then(({ error }) => {
        handleResponse({ error }, setError, fetchPosts);
        dispatch(setIsReplyModalOpen(false));
        dispatch(setPostContentInput(""));
      })
      .catch(console.error);
  };

  const deletePost = (id: number) => {
    fetch(`/uhelp-api/post/${id}/delete`, {
      method: "POST",
      headers: authHeader,
    })
      .then(() => {
        dispatch(setIsDeleteModalOpen(false));
        fetchPosts();
      })
      .catch(console.error);
  };

  const deleteReply = (id: number | null) => {
    fetch(`/uhelp-api/reply/${id}/delete`, {
      method: "POST",
      headers: authHeader,
    })
      .then(() => {
        dispatch(setIsDeleteModalOpen(false));
        fetchPosts();
      })
      .catch(console.error);
  };

  const updatePost = (id: number) => {
    const error = checkInput(postTitleInput, postContentInput);
    if (error) {
      dispatch(setError(error));
      return;
    }

    fetch(`/uhelp-api/post/${id}/update`, {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        title: postTitleInput,
        content: postContentInput,
      }),
    })
      .then((res) => res.json())
      .then(({ error }) => {
        handleResponse({ error }, setError, fetchPosts);
        dispatch(setIsEditModalOpen(false));
        dispatch(setPostID(0));
        dispatch(setPostTitleInput(""));
        dispatch(setPostContentInput(""));
      })
      .catch(console.error);
  };

  const updateReply = (id: number | null) => {
    if (postContentInput === "") {
      setError("Reply cannot be empty");
      return;
    }

    fetch(`/uhelp-api/reply/${id}/update`, {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        content: postContentInput,
      }),
    })
      .then((res) => res.json())
      .then(({ error }) => {
        handleResponse({ error }, setError, fetchPosts);
        dispatch(setIsEditModalOpen(false));
        dispatch(setPostContentInput(""));
      })
      .catch(console.error);
  };

  const like = (id: number, isReply: boolean, depth: number = 0) => {
    const updateLikes = (data: Post[] | undefined, depth: number): Post[] => {
      if (data && depth === 0) {
        return data.map((post: Post) =>
          post.id === id
            ? {
                ...post,
                liked: !post.liked,
                likes: post.liked ? post.likes - 1 : post.likes + 1,
              }
            : post
        );
      } else {
        if (!data) return [];
        return data.map((post: any) =>
          post.replies
            ? { ...post, replies: updateLikes(post.replies, depth - 1) }
            : post
        );
      }
    };

    const updatedPosts = isReply
      ? updateLikes(posts, depth + 1)
      : updateLikes(posts, 0);

    const updatedPostsFetcher = async (): Promise<Post[]> => {
      const res = await fetch(
        `/uhelp-api/${isReply ? "reply" : "post"}/${id}/like`,
        {
          method: "GET",
          headers: authHeader,
        }
      );
      const data = await res.json();
      return data;
    };

    fetchPosts(updatedPostsFetcher(), {
      optimisticData: updatedPosts,
      rollbackOnError: true,
      populateCache: true,
      revalidate: false,
    });
  };

  const formatDateTime = (date: string) => {
    const postedDate = new Date(date);
    const localOffset = new Date().getTimezoneOffset();
    const localTime = new Date(postedDate.getTime() - localOffset * 60 * 1000);
    const now = new Date();
    const diffInMs = Math.abs(now.getTime() - localTime.getTime());
    const diffInSeconds = Math.round(diffInMs / 1000);
    const diffInMinutes = Math.round(diffInMs / (1000 * 60));
    const diffInHours = Math.round(diffInMs / (1000 * 60 * 60));

    return diffInSeconds < 60
      ? diffInSeconds + "s ago"
      : diffInMinutes < 60
      ? diffInMinutes + "m ago"
      : diffInHours < 24
      ? diffInHours + "h ago"
      : "on " +
        localTime.toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
        });
  };

  const renderPost = (isReply: boolean, post: any, postID: number) => (
    <div
      key={post.id}
      className={styles.post}
      style={
        isReply
          ? {
              marginLeft: (post.depth + 1) * (isMobile ? 10 : 20),
              width: `calc(100% - ${
                (post.depth + 1) * (isMobile ? 10 : 20)
              }px)`,
            }
          : {}
      }>
      <div className={styles.postHeader}>
        <div className={styles.postHeaderLeft}>
          {!isReply && <span className={styles.postTitle}>{post.title}</span>}
          <div>
            <span className={styles.postAuthor}>
              <FaUserAlt className={styles.userIcon} />
              {post.author.display_name}
            </span>
            <span className={styles.postDetails}>
              {` \u2022 ${formatDateTime(post.date)}${
                post.edited ? " \u2022 (edited)" : ""
              }`}
            </span>
          </div>
        </div>
        <div className={styles.postHeaderRight}>
          {post.author.username === username && (
            <>
              <Button
                tertiary
                icon={IoTrash}
                onClick={() => {
                  if (isReply) dispatch(setReplyID(post.id));
                  else dispatch(setPostID(post.id));
                  dispatch(setAction(isReply ? "reply" : "post"));
                  dispatch(setIsDeleteModalOpen(true));
                }}
              />
              <Button
                tertiary
                icon={MdModeEdit}
                onClick={() => {
                  if (isReply) {
                    dispatch(setPostID(postID));
                    dispatch(setReplyID(post.id));
                  } else {
                    dispatch(setPostID(post.id));
                    dispatch(setPostTitleInput(post.title));
                  }
                  dispatch(setAction(isReply ? "reply" : "post"));
                  dispatch(setPostContentInput(post.content));
                  dispatch(setIsEditModalOpen(true));
                }}
              />
            </>
          )}
          <Button
            tertiary
            icon={MdReply}
            onClick={() => {
              if (isReply) {
                dispatch(setPostID(postID));
                dispatch(setReplyID(post.id));
              } else {
                dispatch(setPostID(post.id));
                dispatch(setReplyID(null));
              }
              dispatch(setIsReplyModalOpen(true));
            }}
          />
        </div>
      </div>
      <div className={styles.postContent}>{post.content}</div>
      <div className={styles.postFooter}>
        <motion.span
          whileTap={{
            scale: [null, 1.1],
            y: [null, -2],
          }}
          className={`${styles.postLikes}${
            post.liked ? " " + styles.liked : ""
          }`}
          onClick={() => {
            like(isReply ? post.id : postID, isReply, isReply ? post.depth : 0);
          }}>
          {post.likes} <AiFillLike className={styles.likeIcon} />
        </motion.span>
      </div>
    </div>
  );

  const renderReplies = (replies: Reply[], postID: number): JSX.Element[] =>
    replies.map((reply) => (
      <motion.div
        key={reply.id}
        variants={postAnimation}
        initial="initial"
        animate="visible"
        exit="exit">
        {renderPost(true, reply, postID)}
        <AnimatePresence>
          {reply.replies && renderReplies(reply.replies, postID)}
        </AnimatePresence>
      </motion.div>
    ));

  return (
    session && (
      <>
        <Sidebar />
        <div
          style={{
            width: isMobile ? "100%" : "calc(100% - 300px)",
            marginLeft: isMobile ? "0" : "300px",
          }}>
          <div
            className={`${styles.header} ${zeroRightClassName}`}
            style={{ width: isMobile ? "100%" : "calc(100% - 300px)" }}>
            <div className={styles.channelInfo}>
              {channelName ? (
                <h2>{channelName}</h2>
              ) : (
                <Skeleton width={"8rem"} height={"1.5rem"} />
              )}
              {!channelDescription && !channelName && (
                <div style={{ height: "0.5rem" }} />
              )}
              {channelDescription ? (
                <span className={styles.channelDescription}>
                  {channelDescription}
                </span>
              ) : (
                <>
                  <Skeleton width={"16rem"} height={"1.3rem"} />
                </>
              )}
            </div>
            <div className={styles.headerButtons}>
              <Button
                sm
                tertiary
                icon={MdPostAdd}
                label="New Post"
                onClick={() => dispatch(setIsPostModalOpen(true))}
              />
              <Account />
            </div>
          </div>
          <div className={styles.contentWrapper}>
            <div className={styles.postsWrapper}>
              <AnimatePresence mode="popLayout">
                {(isLoading || status.toString() === "loading") && (
                  <div className={styles.noPosts}>
                    <div className={styles.loadingIndicator}>
                      {Array.from({ length: 12 }, (_, i) => (
                        <div key={i} />
                      ))}
                    </div>
                  </div>
                )}
                {posts?.length === 0 ? (
                  <motion.div
                    className={styles.noPosts}
                    variants={postAnimation}
                    initial="initial"
                    animate="visible"
                    exit="exit">
                    <h3>No posts yet</h3>
                    <p>Be the first to post!</p>
                  </motion.div>
                ) : (
                  posts?.map((post) => (
                    <motion.div
                      key={post.id}
                      className={styles.postWrapper}
                      variants={postAnimation}
                      initial="initial"
                      animate="visible"
                      exit="exit">
                      {renderPost(false, post, post.id)}
                      <AnimatePresence>
                        {post.replies && renderReplies(post.replies, post.id)}
                      </AnimatePresence>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* New Post Modal */}
          <Modal
            status={isPostModalOpen}
            handleClose={() => dispatch(setIsPostModalOpen(false))}
            title={"New Post"}
            width={"30%"}>
            <div className={styles.modalBodyWrapper}>
              <div className={styles.modalBody}>
                <div className={styles.modalForm}>
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
                </div>
                <div className="centerRow">
                  {error && <p className={styles.error}>{error}</p>}
                </div>
              </div>
              <div className={styles.modalFooter}>
                <Button
                  secondary
                  sm
                  onClick={() => addPost()}
                  label={"Add Post"}></Button>
              </div>
            </div>
          </Modal>

          {/* Edit Post Modal */}
          <Modal
            status={isEditModalOpen}
            handleClose={() => {
              dispatch(setIsEditModalOpen(false));
              dispatch(setPostID(0));
              dispatch(setPostTitleInput(""));
              dispatch(setPostContentInput(""));
            }}
            title={`Edit ${actionType === "post" ? "Post" : "Reply"}`}
            width={"30%"}>
            <div className={styles.modalBodyWrapper}>
              <div className={styles.modalBody}>
                <div className={styles.modalForm}>
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
                </div>
                <div className="centerRow">
                  {error && <p className={styles.error}>{error}</p>}
                </div>
              </div>
              <div className={styles.modalFooter}>
                <Button
                  secondary
                  sm
                  onClick={() => {
                    if (actionType === "post") {
                      updatePost(postID);
                    } else if (actionType === "reply") {
                      updateReply(replyID);
                    }
                  }}
                  label={`Update ${actionType === "post" ? "Post" : "Reply"}`}
                />
              </div>
            </div>
          </Modal>

          {/* Delete Post Modal */}
          <Modal
            status={isDeleteModalOpen}
            handleClose={() => dispatch(setIsDeleteModalOpen(false))}
            title={`Delete ${actionType === "post" ? "Post" : "Reply"}`}>
            <div className={styles.modalBodyWrapper}>
              <div className={styles.modalBody}>
                <div className="centerRow">
                  <p>{`Are you sure you want to permanently delete this ${
                    actionType === "post" ? "post" : "reply"
                  }?`}</p>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <Button
                  secondary
                  sm
                  onClick={() => {
                    if (actionType === "post") {
                      deletePost(postID);
                    } else if (actionType === "reply") {
                      deleteReply(replyID);
                    }
                  }}
                  label={`Delete ${actionType === "post" ? "Post" : "Reply"}`}
                />
              </div>
            </div>
          </Modal>

          {/* Reply Modal */}
          <Modal
            status={isReplyModalOpen}
            handleClose={() => {
              dispatch(setIsReplyModalOpen(false));
            }}
            title={"Reply"}
            width={"30%"}>
            <div className={styles.modalBodyWrapper}>
              <div className={styles.modalBody}>
                <div className={styles.modalForm}>
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
                </div>
                <div className="centerRow">
                  {error && <p className={styles.error}>{error}</p>}
                </div>
              </div>
              <div className={styles.modalFooter}>
                <Button
                  secondary
                  sm
                  onClick={() => addReply(postID, replyID)}
                  label={"Add Reply"}></Button>
              </div>
            </div>
          </Modal>
        </div>
      </>
    )
  );
}

export default Forum;
