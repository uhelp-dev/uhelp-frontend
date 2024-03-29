"use client";
import "katex/dist/katex.min.css";
import React, { useState } from "react";
import styles from "@/app/styles/Forum.module.scss";
import Button from "@/components/Button";
import CodeCopy from "./CodeCopy";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import Avatar from "react-avatar";
import clsx from "clsx";
import { formatTime } from "../../../app/(Forum)/forum/[channelID]/helper";
import { IoTrash } from "react-icons/io5";
import { AiFillLike } from "react-icons/ai";
import { AiFillDislike } from "react-icons/ai";
import { MdReply, MdModeEdit } from "react-icons/md";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { postAnimation } from "@/utils/Animations";
import { Reply } from "@/utils/Types";
import {
  setIsOpen,
  setModalType,
  setPostID,
  setReplyID,
  setAction,
  setPostTitleInput,
  setPostContentInput,
  setReplyDepth,
} from "@/redux/slices/forumSlice";
import { avatarColors } from "@/utils/AppConfig";
import Tooltip from "../../Tooltip";
import { useRateItemMutation } from "@/app/api/postsApi";

interface Props {
  isReply: boolean;
  post: any;
  parentID: number;
}

function Post({ isReply, post, parentID }: Props) {
  const { data: session } = useSession();
  const username = session?.user?.username;
  const dispatch = useDispatch();
  const [isLikeAnimating, setIsLikeAnimating] = useState<boolean>(false);
  const [isDislikeAnimating, setIsDislikeAnimating] = useState<boolean>(false);
  const [rateItem] = useRateItemMutation();

  const handleRating = (isLike: boolean) => {
    rateItem({
      id: isReply ? post.id : parentID,
      isLike: isLike,
      isReply: isReply,
    });
  };

  const handleReply = () => {
    if (isReply) {
      dispatch(setPostID(parentID));
      dispatch(setReplyID(post.id));
    } else {
      dispatch(setPostID(post.id));
      dispatch(setReplyID(null));
    }
    dispatch(setModalType("Reply"));
    dispatch(setIsOpen(true));
  };

  const handleEdit = () => {
    if (isReply) {
      dispatch(setPostID(parentID));
      dispatch(setReplyID(post.id));
    } else {
      dispatch(setPostID(post.id));
      dispatch(setPostTitleInput(post.title));
    }
    dispatch(setAction(isReply ? "reply" : "post"));
    dispatch(setPostContentInput(post.content));
    dispatch(setModalType("Edit"));
    dispatch(setIsOpen(true));
  };

  const handleDelete = () => {
    if (isReply) {
      dispatch(setPostID(parentID));
      dispatch(setReplyID(post.id));
      dispatch(setReplyDepth(post.depth));
    } else dispatch(setPostID(post.id));
    dispatch(setAction(isReply ? "reply" : "post"));
    dispatch(setModalType("Delete"));
    dispatch(setIsOpen(true));
  };

  const postDetails = (
    <div className={styles.postDetailsContainer}>
      <Avatar
        name={post.author.display_name}
        round={"0.25rem"}
        textSizeRatio={2}
        size={"32px"}
        color={
          avatarColors[
            (post.author.display_name.charCodeAt(0) +
              post.author.display_name.charCodeAt(
                post.author.display_name.length - 1
              )) %
              avatarColors.length
          ]
        }
        style={{ border: "none" }}
        className={styles.postAvatar}
      />
      <span className={styles.postAuthor}>{post.author.display_name}</span>
      <span className={styles.postDetail}>
        <Tooltip content={formatTime(post.date, true)}>
          {formatTime(post.date, false)}
        </Tooltip>
      </span>
      {post.edited && (
        <span className={styles.postDetail}>
          <Tooltip content={formatTime(post.edited_date, true)}>
            {"(edited)"}
          </Tooltip>
        </span>
      )}
    </div>
  );

  return (
    <motion.div
      key={`${isReply ? "reply" : "post"}-${post.id}-${post.date}`}
      className={clsx(!isReply && styles.postWrapper)}
      layout="position"
      variants={postAnimation}
      initial="initial"
      animate="visible"
      exit="exit">
      <div key={post.id} className={clsx(isReply ? styles.reply : styles.post)}>
        <div className={styles.postHeader}>
          {isReply ? (
            postDetails
          ) : (
            <span className={styles.postTitle}>{post.title}</span>
          )}
          <div className={styles.postActions}>
            {post.author.username === username && (
              <>
                <Button tertiary icon={IoTrash} onClick={handleDelete} />
                <Button tertiary icon={MdModeEdit} onClick={handleEdit} />
              </>
            )}
            <Button tertiary icon={MdReply} onClick={handleReply} />
          </div>
        </div>
        {!isReply && postDetails}
        <ReactMarkdown
          remarkPlugins={[
            [remarkGfm, { singleTilde: false }],
            remarkBreaks,
            remarkMath,
          ]}
          rehypePlugins={[rehypeKatex]}
          linkTarget="_blank noopener noreferrer"
          skipHtml
          disallowedElements={["img"]}
          className={styles.postContent}
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "");
              return !inline && match ? (
                <SyntaxHighlighter
                  customStyle={{
                    background: "none",
                    padding: 0,
                    textShadow: "none",
                  }}
                  codeTagProps={{
                    style: {
                      textShadow: "none",
                    },
                  }}
                  showLineNumbers
                  language={match[1]}
                  PreTag="div">
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              ) : (
                <code {...props} className={className}>
                  {children}
                </code>
              );
            },
            pre: (pre: any) => <CodeCopy pre={pre} />,
          }}>
          {post.content}
        </ReactMarkdown>
        <div className={styles.postFooter}>
          <motion.span
            whileTap={{
              scale: 1.1,
              y: -2,
            }}
            className={clsx(styles.postLikes, post.liked && styles.liked)}
            onTapStart={() => setIsLikeAnimating(true)}
            onClick={() => handleRating(true)}>
            {post.likes}{" "}
            <motion.span
              animate={{
                y: isLikeAnimating ? -2 : 0,
                rotate: isLikeAnimating ? -5 : 0,
              }}
              transition={{ duration: 0.15, delay: 0.05, ease: "easeInOut" }}
              onAnimationComplete={() => setIsLikeAnimating(false)}>
              <AiFillLike className={styles.likeIcon} />
            </motion.span>
          </motion.span>
          <motion.span
            whileTap={{
              scale: 1.1,
              y: 2,
            }}
            className={clsx(styles.postLikes, post.disliked && styles.liked)}
            onTapStart={() => setIsDislikeAnimating(true)}
            onClick={() => handleRating(false)}>
            {post.dislikes}{" "}
            <motion.span
              animate={{
                y: isDislikeAnimating ? 2 : 0,
                rotate: isDislikeAnimating ? 5 : 0,
              }}
              transition={{ duration: 0.15, delay: 0.05, ease: "easeInOut" }}
              onAnimationComplete={() => setIsDislikeAnimating(false)}>
              <AiFillDislike className={styles.likeIcon} />
            </motion.span>
          </motion.span>
        </div>
      </div>
      {post.replies?.length > 0 && (
        <div className={styles.replyWrapper}>
          {post.replies.map((reply: Reply) => (
            <Post key={reply.id} post={reply} parentID={parentID} isReply />
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default Post;
