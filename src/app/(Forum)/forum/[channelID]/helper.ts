import { store } from "@/redux/store";
import {
  setError,
  setIsDeleteModalOpen,
  setIsEditModalOpen,
  setIsPostModalOpen,
  setIsReplyModalOpen,
  setPostContentInput,
  setPostID,
  setPostTitleInput,
} from "@/redux/slices/forumSlice";
import { Category, Channel, Post } from "@/utils/Types";

const apiURL = process.env.NEXT_PUBLIC_API_URL;
const dispatch = store.dispatch;

const handleResponse = (data: any, setError: Function, refreshData: Function) =>
  data.error ? setError(data.error) : refreshData();

const getAuthHeader = async () => {
  const res = await fetch("/api/auth/session");
  const data = await res.json();
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer " + data.user.access_token,
  };
};

const checkInput = (title: string, content: string) =>
  title === ""
    ? "Title cannot be empty"
    : content === ""
    ? "Content cannot be empty"
    : null;

export const formatTime = (date: string) => {
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

export const addPost = async (channelID: string, refreshData: Function) => {
  const postTitleInput = store.getState().forum.postTitleInput;
  const postContentInput = store.getState().forum.postContentInput;

  const error = checkInput(postTitleInput, postContentInput);
  if (error) {
    dispatch(setError(error));
    return;
  }

  fetch(`${apiURL}/post/new`, {
    method: "POST",
    headers: await getAuthHeader(),
    body: JSON.stringify({
      title: postTitleInput,
      content: postContentInput,
      channel_id: channelID,
    }),
  })
    .then((res) => res.json())
    .then(({ error }) => {
      handleResponse({ error }, setError, refreshData);
      dispatch(setIsPostModalOpen(false));
      dispatch(setPostTitleInput(""));
      dispatch(setPostContentInput(""));
    })
    .catch(console.error);
};

export const addReply = async (
  id: number,
  parent_id: number | null,
  refreshData: Function
) => {
  const postContentInput = store.getState().forum.postContentInput;
  if (postContentInput === "") {
    dispatch(setError("Reply cannot be empty"));
    return;
  }

  fetch(`/uhelp-api/post/${id}/reply`, {
    method: "POST",
    headers: await getAuthHeader(),
    body: JSON.stringify({
      content: postContentInput,
      post_id: id,
      parent_reply_id: parent_id,
    }),
  })
    .then((res) => res.json())
    .then(({ error }) => {
      handleResponse({ error }, setError, refreshData);
      dispatch(setIsReplyModalOpen(false));
      dispatch(setPostContentInput(""));
    })
    .catch(console.error);
};

export const editPost = async (id: number, refreshData: Function) => {
  const postTitleInput = store.getState().forum.postTitleInput;
  const postContentInput = store.getState().forum.postContentInput;

  const error = checkInput(postTitleInput, postContentInput);
  if (error) {
    dispatch(setError(error));
    return;
  }

  fetch(`/uhelp-api/post/${id}/update`, {
    method: "POST",
    headers: await getAuthHeader(),
    body: JSON.stringify({
      title: postTitleInput,
      content: postContentInput,
    }),
  })
    .then((res) => res.json())
    .then(({ error }) => {
      handleResponse({ error }, setError, refreshData);
      dispatch(setIsEditModalOpen(false));
      dispatch(setPostID(0));
      dispatch(setPostTitleInput(""));
      dispatch(setPostContentInput(""));
    })
    .catch(console.error);
};

export const editReply = async (id: number | null, refreshData: Function) => {
  const postContentInput = store.getState().forum.postContentInput;

  if (postContentInput === "") {
    setError("Reply cannot be empty");
    return;
  }

  fetch(`/uhelp-api/reply/${id}/update`, {
    method: "POST",
    headers: await getAuthHeader(),
    body: JSON.stringify({
      content: postContentInput,
    }),
  })
    .then((res) => res.json())
    .then(({ error }) => {
      handleResponse({ error }, setError, refreshData);
      dispatch(setIsEditModalOpen(false));
      dispatch(setPostContentInput(""));
    })
    .catch(console.error);
};

export const deletePost = async (id: number, refreshData: Function) => {
  fetch(`/uhelp-api/post/${id}/delete`, {
    method: "POST",
    headers: await getAuthHeader(),
  })
    .then(() => {
      dispatch(setIsDeleteModalOpen(false));
      refreshData();
    })
    .catch(console.error);
};

export const deleteReply = async (id: number | null, refreshData: Function) => {
  fetch(`/uhelp-api/reply/${id}/delete`, {
    method: "POST",
    headers: await getAuthHeader(),
  })
    .then(() => {
      dispatch(setIsDeleteModalOpen(false));
      refreshData();
    })
    .catch(console.error);
};

export const like = async (
  id: number,
  isReply: boolean,
  depth: number = 0,
  fetchPosts: Function,
  posts: Post[] | undefined
) => {
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
        headers: await getAuthHeader(),
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

export const categoriesFetcher = async (url: string): Promise<Category[]> =>
  fetch(url, {
    method: "GET",
    headers: await getAuthHeader(),
  })
    .then((res) => res.json())
    .then((data) => {
      return data.categories;
    });

export const channelFetcher = async (url: string): Promise<any> =>
  fetch(url, {
    method: "GET",
    headers: await getAuthHeader(),
  })
    .then((res) => res.json())
    .then((data) => {
      return data;
    });