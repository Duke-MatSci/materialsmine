export default {
    namespaced: true,
    state: {
        fetchedNames: [], 
        datasets: [], 
        activeData: [], 
        dataLibrary: [], 
        dataPoint: {}, 
    }, 
    getters: {
        getFetchedNames: state => state.fetchedNames,
        getDatasets: state => state.datasets,
        getActiveData: state => state.activeData,
        getDataLibrary: state => state.dataLibrary,
        getDataPoint: state => state.dataPoint,
    },
    actions: {
        setDataPoint(context, payload) {
            context.commit('setDataPoint', payload);
        },
        setFetchedNames(context, payload) {
            context.commit('setFetchedNames', payload);
        },
        setDatasets(context, payload) {
            context.commit('setDatasets', payload);
        },
        setActiveData(context, payload) {
            context.commit('setActiveData', payload);
        }, 
        setDataLibrary(context, payload) {
            context.commit('setDataLibrary', payload);
        },
    }, 
    mutations: {
        setDataPoint(state, payload) {
            state.dataPoint = payload;
            console.log('mutation setDataPoint: ', state.dataPoint)
        },
        setFetchedNames(state, payload) {
            state.fetchedNames = payload;
        },
        setDatasets(state, payload) {
            state.datasets = payload;
        },
        setActiveData(state, payload) {
            state.activeData = payload;
        },
        setDataLibrary(state, payload) {
            state.dataLibrary = payload;
        }

    }
}