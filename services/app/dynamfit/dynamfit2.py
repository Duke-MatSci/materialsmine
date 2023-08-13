import pandas as pd
import numpy as np

from app.dynamfit.helper import prony_linear_fit, compute_rspectum

def upload_init(arg):
    df = pd.read_csv(arg, delimiter="\t")
    df.columns =['Frequency', 'E Storage', 'E Loss']
    return df.to_dict("records")

def update_line_chart(args):
    if args is not None:
        # dfl = args.dfl
        linear_model = args['linearModel']
        prony_term_number = args['pronyTermNumber']
        # fit_settings = args.fitSettings
        # df = pd.DataFrame()
        print(linear_model)
        return linear_model
    else: 
        return None
    
    # if dfl is not None:
    #     print(N)
    #     print(fit_settings)
    #     df = pd.DataFrame(dfl)
    #     # print(df.columns)

    #     tau, E, complex, relax = prony_linear_fit(df, N, model)
    #     N_nz = np.count_nonzero(E)

    #     # Get the column names of the first two columns as x and y
    #     x_column_name = df.columns[0]
    #     y_column_name = df.columns[1]
    #     z_column_name = df.columns[2]

    #     df_melt = pd.melt(df, id_vars=[x_column_name], 
    #                     value_vars=[y_column_name, z_column_name], 
    #                     var_name='Modulus', value_name="Young's Modulus (MPa)")
    #     df_melt["Type"] = "Experiment"

    #     x_column_name = complex.columns[0]
    #     y_column_name = complex.columns[1]
    #     z_column_name = complex.columns[2]

    #     complex_melt = pd.melt(complex, id_vars=[x_column_name], 
    #                     value_vars=[y_column_name, z_column_name], 
    #                     var_name='Modulus', value_name="Young's Modulus (MPa)")
    #     complex_melt["Type"] = f"{N_nz}-Term Prony"

    #     df_concat = pd.concat([df_melt, complex_melt], ignore_index=True)

    #     fig1 = px.line(df_concat, x=x_column_name, y="Young's Modulus (MPa)", 
    #             log_x=True, 
    #             log_y=True, 
    #             facet_col='Modulus',
    #             color="Type", line_dash="Type",
    #             line_dash_map={"Experiment":"solid", f"{N_nz}-Term Prony":"dash"},
    #             template=template_from_url(theme),
    #             labels={
    #                 "Frequency": "Frequency (Hz)",
    #             },
    #             )
        
    #     # df11 = df.copy()
    #     # df11["tan delta"] = df['E Loss']/df['E Storage']
    #     df11_concat = df_concat.copy()
    #     df11_tand = pd.DataFrame()
    #     df11_tand["Frequency"] = df11_concat[df11_concat["Modulus"] == "E Loss"]["Frequency"]
    #     df11_tand["Type"] = df11_concat[df11_concat["Modulus"] == "E Loss"]["Type"]
    #     # print(df11_tand.head(5))
    #     # print(df11_concat[df11_concat["Modulus"] == "E Loss"]["Young's Modulus (MPa)"].head(5))
    #     # print("Storage")
    #     # print(df11_concat.head(5))
    #     # print(df11_concat[df11_concat["Modulus"] == "E Storage"].head(5))
    #     # print(df11_concat[df11_concat["Modulus"] == "E Storage"]["Young's Modulus (MPa)"].head(5))

    #     # print("Loss")
    #     # print(df11_concat.head(5))
    #     # print(df11_concat[df11_concat["Modulus"] == "E Loss"].head(5))
    #     # print(df11_concat[df11_concat["Modulus"] == "E Loss"]["Young's Modulus (MPa)"].head(5))

    #     # print('tandelta')
    #     # tandelta = df11_concat[df11_concat["Modulus"] == "E Loss"]["Young's Modulus (MPa)"] / df11_concat[df11_concat["Modulus"] == "E Storage"]["Young's Modulus (MPa)"]
    #     # print(tandelta.head(5))
    #     # print('tandelta 2')
    #     # loss = df11_concat[df11_concat["Modulus"] == "E Loss"]["Young's Modulus (MPa)"]
    #     # storage = df11_concat[df11_concat["Modulus"] == "E Storage"]["Young's Modulus (MPa)"]
    #     # tandelta2 = np.divide(loss.to_numpy(), storage.to_numpy())
    #     # print(tandelta2)

    #     df11_tand["Young's Modulus (MPa)"] = df11_concat[df11_concat["Modulus"] == "E Loss"]["Young's Modulus (MPa)"].to_numpy() / df11_concat[df11_concat["Modulus"] == "E Storage"]["Young's Modulus (MPa)"].to_numpy()
    #     # print(df11_tand.head(5))
    #     df11_tand['Modulus'] = 'tan delta'
    #     # print(df11_tand.head(5))
    #     df11_concat = pd.concat([df11_concat, df11_tand], ignore_index=True)

    #     print(df11_tand.head(5))
    #     print(df11_concat)

    #     fig11 = px.line(df11_concat[df11_concat['Modulus']!="E Loss"], x="Frequency", y="Young's Modulus (MPa)", 
    #             log_x=True, 
    #             # log_y=True, 
    #             facet_col='Modulus',
    #             color="Type", line_dash="Type",
    #             line_dash_map={"Experiment":"solid", f"{N_nz}-Term Prony":"dash"},
    #             template=template_from_url(theme),
    #             labels={
    #                 "Frequency": "Frequency (Hz)",
    #             },
    #             )
    #     fig11.update_yaxes(matches=None, showticklabels=True)
    #     fig11.update_yaxes(type="log", col=1)
        

    #     # fig11 = make_subplots(rows=1, cols=2)
    #     # fig11.add_trace(
    #     #     go.Scatter(x=df["Frequency"], y=df['E Storage'], 
    #     #         marker=dict(color=2),
    #     #         # log_x=True, 
    #     #         # log_y=True, 
    #     #         # facet_col='Modulus',
    #     #         # color="Type", line_dash="Type",
    #     #         # line_dash_map={"Experiment":"solid", f"{N_nz}-Term Prony":"dash"},
    #     #         ),
    #     #     row=1, col=1
    #     #     )

    #     # fig11.add_trace(
    #     #     go.Scatter(x=df["Frequency"], y=df['E Loss']/df['E Storage'], 
    #     #         # log_x=True, 
    #     #         # log_y=True, 
    #     #         # facet_col='Modulus',
    #     #         # color="Type", line_dash="Type",
    #     #         # line_dash_map={"Experiment":"solid", f"{N_nz}-Term Prony":"dash"},
    #     #         ),
    #     #     row=1, col=2
    #     #     )

    #     # fig11.update_layout(
    #     #     template=template_from_url(theme),
    #     #     autosize=False,
    #     #     width=800,
    #     #     height=450,
    #     #     margin=dict(l=80, r=60, t=60, b=80),
    #     # )

    #     # fig11.update_xaxes(title_text="Frequency (Hz)", type="log", row=1, col=1)
    #     # fig11.update_yaxes(title_text="Storage Modulus (MPa)", type="log", row=1, col=1)

    #     # fig11.update_xaxes(title_text="Frequency (Hz)", type="log", row=1, col=2)
    #     # fig11.update_yaxes(title_text="tan(δ)", row=1, col=2)
        
    #     # full_fig = fig1.full_figure_for_development()
    #     # axs = full_fig.axes
    #     # print(axs)
    #     # for ax in fig1.axes_dict.values():
    #     #     # ax.lineplot(mat['frequency'], mat['tandelta'])
    #     #     sns.lineplot(mat, x='frequency', y='tan delta', ax=ax, legend=False, alpha=0.2)
    #     #     # ax.axline((0, 0), slope=.2, c=".2", ls="--", zorder=0)
        
    #     relax["Type"] = f"{N_nz}-Term Prony"
    #     fig2a = px.line(relax, x="Time", y="E", 
    #             log_x=True, 
    #             log_y=True, 
    #             # facet_col='Modulus',
    #             color="Type", line_dash="Type",
    #             line_dash_map={"Basis":"solid", f"{N_nz}-Term Prony":"dash"},
    #             template=template_from_url(theme),
    #             # width=800, height=450,
    #             labels={
    #                 "Time": "Time (s)",
    #                 "E": "Relaxation Modulus (MPa)",
    #             },
    #             )
    #     fig2a.update_layout(
    #         autosize=False,
    #         width=800,
    #         height=450,
    #         margin=dict(l=80, r=60, t=60, b=80),
    #         )
        
    #     basis_df = pd.DataFrame()
    #     basis_df["Time"] = tau
    #     basis_df["E"] = E
    #     basis_df["Type"] = f"{N_nz}-Term Basis"
    #     # basis_df["Modulus"] = "E Storage"

    #     fig2b = px.scatter(basis_df, x="Time", y="E",
    #             log_x=True, 
    #             log_y=True,
    #             symbol= "Type",
    #             # label="Type",
    #             # facet_col='Modulus',
    #             # color="Type", line_dash="Type",
    #             # line_dash_map={"Basis":"solid", f"{N_nz}-Term Prony":"dash"},
    #             # scatter_marker_map={"Basis":"solid", f"{N_nz}-Term Prony":"dash"},
    #             template=template_from_url(theme),
    #             labels={
    #                 "Time": "Time (s)",
    #                 "E": "Relaxation Modulus (MPa)",
    #             },
    #             )
    #     fig2 = go.Figure(data = fig2a.data + fig2b.data,
    #                     #  layout_xaxis_range=["auto",4],
    #                      )
    #     fig2.update_xaxes(type="log")
    #     fig2.update_yaxes(type="log")

    #     fig2.update_layout(
    #                     autosize=False,
    #                     margin=dict(l=80, r=60, t=60, b=80),
    #                     # width=800, height=550,
    #                     xaxis_title="Time (s)",
    #                     yaxis_title="Relaxation Modulus (MPa)",
    #                     legend_title="Type",
    #                     template=template_from_url(theme),
    #     )


    #     rspectrum = compute_rspectum(tau, E)

    #     rspectrum["Type"] = f"{N_nz}-Term Prony"
    #     fig3a = px.line(rspectrum, x="Time", y="H", 
    #             log_x=True, 
    #             log_y=True, 
    #             # facet_col='Modulus',
    #             color="Type", line_dash="Type",
    #             line_dash_map={"Basis":"solid", f"{N_nz}-Term Prony":"dash"},
    #             template=template_from_url(theme),
    #             # width=800, height=450,
    #             labels={
    #                 "Time": "Time (s)",
    #                 "H": "Relaxation Spectrum (MPa)",
    #             },
    #             )
    #     fig3a.update_layout(
    #         autosize=False,
    #         width=800,
    #         height=450,
    #         margin=dict(l=80, r=60, t=60, b=80),
    #         )


    #     fig3 = go.Figure(data = fig3a.data + fig2b.data,
    #                     #  layout_xaxis_range=["auto",4],
    #                      )
    #     fig3.update_xaxes(type="log")
    #     fig3.update_yaxes(type="log")

    #     fig3.update_layout(
    #                     autosize=False,
    #                     margin=dict(l=80, r=60, t=60, b=80),
    #                     # width=800, height=550,
    #                     xaxis_title="Time (s)",
    #                     yaxis_title="Relaxation Spectrum (MPa)",
    #                     legend_title="Type",
    #                     template=template_from_url(theme),
    #     )

    #     if "Show Basis Functions" in fit_settings:
    #         fig2 = fig2
    #         fig3 = fig3
    #     else:
    #         fig2 = fig2a
    #         fig3 = fig3a


    #     coef = {"tau_i":tau, "E_i":E,}
    #     coef_df = pd.DataFrame(coef)
    #     coef_df = coef_df[coef_df.E_i != 0].reset_index(drop=False)
    #     # df.reset_index(inplace=True)
    #     coef_df = coef_df.rename(columns = {'index':'i'})
    #     coef_file = "./data/fit_coef.csv"
    #     coef_df.to_csv(coef_file, index=False)

    #     return fig1, fig11, fig2, fig3, coef_df.to_dict("records")
