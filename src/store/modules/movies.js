import axios from "@/plugins/axios";
import IDs from "@/store/mock/imdb250.js";
import mitations from "@/store/mutations";

function serialaizeResponse(movies) {
  return movies.reduce((acc, movie) => {
    acc[movie.imdbID] = movie;
    return acc;
  }, {});
}
const { MOVIES, CURRENT_PAGE, REMOVE_MOVIE, TOGGLE_SEARCH } = mitations;

const moviesStore = {
  namespaced: true,
  state: {
    top250TDs: IDs,
    moviesPerPage: 12,
    currentPage: 1,
    movies: {},
    isSearch: false,
  },
  getters: {
    MoviesList: ({ movies }) => movies,
    slicedIDs:
      ({ top250TDs }) =>
      (from, to) =>
        top250TDs.slice(from, to),
    currentPage: ({ currentPage }) => currentPage,
    moviesPerPage: ({ moviesPerPage }) => moviesPerPage,
    moviesLength: ({ top250TDs }) => Object.keys(top250TDs).length,
    isSearch: ({ isSearch }) => isSearch,
  },
  mutations: {
    [MOVIES](state, value) {
      state.movies = value;
    },
    [CURRENT_PAGE](state, value) {
      state.currentPage = value;
    },
    [REMOVE_MOVIE](state, index) {
      state.top250TDs.splice(index, 1);
    },
    [TOGGLE_SEARCH](state, bool) {
      state.isSearch = bool;
    },
  },
  actions: {
    async fetchMovies({ getters, commit, dispatch }) {
      try {
        dispatch("toggleLoader", true, { root: true });
        const { currentPage, moviesPerPage, slicedIDs } = getters;
        const from = currentPage * moviesPerPage - moviesPerPage;
        const to = currentPage * moviesPerPage;
        const moviesToFetch = slicedIDs(from, to);
        const requests = moviesToFetch.map((id) => axios.get(`/?i=${id}`));
        const response = await Promise.all(requests);
        const movies = serialaizeResponse(response);
        commit(MOVIES, movies);
      } catch (error) {
        console.log(error);
      } finally {
        dispatch("toggleLoader", false, { root: true });
      }
    },
    changeCurrentPage({ commit, dispatch }, page) {
      commit(CURRENT_PAGE, page);
      dispatch("fetchMovies");
    },
    removeMovie({ commit, dispatch, state }, id) {
      const index = state.top250TDs.findIndex((item) => item === id);
      if (index != -1) {
        commit(REMOVE_MOVIE, index);
        dispatch("fetchMovies");
      }
    },
    async searchMovies({ commit, dispatch }, query) {
      try {
        dispatch("toggleLoader", true, { root: true });
        const response = await axios.get(`/?s=${query}`);
        if (response.Error) {
          throw Error(response.Error);
        }
        const movies = serialaizeResponse(response.Search);
        commit(MOVIES, movies);
      } catch (error) {
        console.log(error.message);
        dispatch(
          "showNotify",
          { msg: error.message, title: "Error", variant: "danger" },
          { root: true }
        );
      } finally {
        dispatch("toggleLoader", false, { root: true });
      }
    },
    toggleSearchState({ commit }, bool) {
      commit(TOGGLE_SEARCH, bool);
    },
  },
};

export default moviesStore;
