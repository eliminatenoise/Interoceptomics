"""Ridge (version 1's closed form) and the MLP: fitting, export and the NumPy forward passes used for
every forecast (PROTOCOL.json models_and_controls.fitting).

The forward passes add terms in a fixed order with elementwise operations, so the forecast for a row
does not depend on which other rows are evaluated with it.
"""
import json

import numpy as np

HIDDEN = 64
BATCH = 1024
EPOCHS = 4
LR = 1e-3
WEIGHT_DECAY = 1e-4
CHUNK = 32768


# ----- ridge -------------------------------------------------------------------------------------

def person_moments(X, y):
    n = len(y)
    return X.mean(0), y.mean(), (X.T @ X) / n, (X.T @ y) / n


def ridge_from_moments(moments, penalty):
    """Version 1's closed form: per-person moments averaged over people, features scaled by the
    person-weighted SD (0 -> 1), penalty on the diagonal of the scaled matrix, intercept unpenalised."""
    xbar, ybar, xx, xy = [np.mean(values, axis=0) for values in zip(*moments, strict=True)]
    cov = xx - np.outer(xbar, xbar)
    xy = xy - xbar * ybar
    sd = np.sqrt(np.maximum(np.diag(cov), 0.0))
    sd[sd == 0] = 1.0
    normalized = cov / np.outer(sd, sd)
    normalized.flat[::len(sd) + 1] += penalty
    coefficient = np.linalg.solve(normalized, xy / sd) / sd
    return {"coefficient": coefficient, "intercept": float(ybar - xbar @ coefficient)}


def ridge_apply(model, X):
    coef = np.asarray(model["coefficient"], dtype=np.float64)
    if X.shape[1] != len(coef):
        raise ValueError("feature count does not match the ridge model")
    acc = np.zeros(X.shape[0])
    for i in range(len(coef)):
        acc += X[:, i] * coef[i]
    return acc + float(model["intercept"])


def ridge_to_json(model, **meta):
    return {**meta, "coefficient": [float(v) for v in model["coefficient"]],
            "intercept": float(model["intercept"])}


# ----- MLP ---------------------------------------------------------------------------------------

def standardizer(Xs):
    """Person-weighted mean and SD of each column (SD 0 -> 1)."""
    mu = np.mean([X.mean(0) for X in Xs], axis=0)
    var = np.mean([((X - mu) ** 2).mean(0) for X in Xs], axis=0)
    sd = np.sqrt(var)
    sd[sd == 0] = 1.0
    return mu, sd


def train_mlp(Xs, ys, seed):
    """Fit one MLP on people Xs (list ordered by subject number, rows by cutoff), targets ys (z units).

    The caller sets torch.set_num_threads(4), torch.set_num_interop_threads(1) and the CPU affinity.
    Returns (model dict with float64 standardiser and float32 weights, torch outputs on every training
    row as float32)."""
    import torch
    torch.use_deterministic_algorithms(True)
    mu, sd = standardizer(Xs)
    X = np.vstack([(x - mu) / sd for x in Xs]).astype(np.float32)
    y = np.concatenate(ys).astype(np.float32)[:, None]
    n_p = [len(v) for v in ys]
    P, N = len(ys), sum(n_p)
    equal = len(set(n_p)) == 1
    w = np.concatenate([np.full(n, N / (P * n)) for n in n_p]).astype(np.float32)[:, None]
    xt, yt, wt = torch.from_numpy(X), torch.from_numpy(y), torch.from_numpy(w)
    torch.manual_seed(seed)
    d = X.shape[1]
    net = torch.nn.Sequential(torch.nn.Linear(d, HIDDEN), torch.nn.GELU(approximate="tanh"),
                              torch.nn.Linear(HIDDEN, HIDDEN), torch.nn.GELU(approximate="tanh"),
                              torch.nn.Linear(HIDDEN, 1))
    opt = torch.optim.AdamW(net.parameters(), lr=LR, betas=(0.9, 0.999), eps=1e-8,
                            weight_decay=WEIGHT_DECAY)
    per_epoch = N // BATCH
    steps = EPOCHS * per_epoch
    sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=LR, total_steps=steps)
    gen = torch.Generator().manual_seed(seed)
    net.train()
    for _ in range(EPOCHS):
        perm = torch.randperm(N, generator=gen)
        for i in range(per_epoch):
            b = perm[i * BATCH:(i + 1) * BATCH]
            err = net(xt[b]) - yt[b]
            loss = torch.mean(err * err) if equal else torch.mean(wt[b] * err * err)
            opt.zero_grad()
            loss.backward()
            opt.step()
            sched.step()
    net.eval()
    with torch.no_grad():
        out = torch.cat([net(xt[i:i + CHUNK]) for i in range(0, N, CHUNK)]).numpy()[:, 0].copy()
    layers = []
    for idx in (0, 2, 4):
        layers.append({"weight": net[idx].weight.detach().numpy().astype(np.float32).copy(),
                       "bias": net[idx].bias.detach().numpy().astype(np.float32).copy()})
    model = {"input_mean": mu, "input_sd": sd, "layers": layers, "seed": seed, "updates": steps,
             "rows": N, "people": P}
    return model, out


_C = np.float32(np.sqrt(2.0 / np.pi))
_KAPPA = np.float32(0.044715)
_HALF = np.float32(0.5)
_ONE = np.float32(1.0)


def gelu_tanh(x):
    return _HALF * x * (_ONE + np.tanh(_C * (x + _KAPPA * x * x * x)))


def _dense(x, W, b):
    Wt = np.ascontiguousarray(W.T)
    acc = np.empty((x.shape[0], W.shape[0]), dtype=np.float32)
    acc[:] = b
    for i in range(x.shape[1]):
        acc += x[:, i:i + 1] * Wt[i]
    return acc


def mlp_forward(model, X):
    """NumPy float32 forward pass of one exported MLP; returns float32 outputs (z units)."""
    mu = np.asarray(model["input_mean"], dtype=np.float64)
    sd = np.asarray(model["input_sd"], dtype=np.float64)
    L = [(np.asarray(l["weight"], dtype=np.float32), np.asarray(l["bias"], dtype=np.float32))
         for l in model["layers"]]
    if X.shape[1] != len(mu):
        raise ValueError("feature count does not match the MLP")
    out = np.empty(X.shape[0], dtype=np.float32)
    for s in range(0, X.shape[0], CHUNK):
        x = ((X[s:s + CHUNK] - mu) / sd).astype(np.float32)
        h = gelu_tanh(_dense(x, *L[0]))
        h = gelu_tanh(_dense(h, *L[1]))
        out[s:s + CHUNK] = _dense(h, *L[2])[:, 0]
    return out


def ensemble(outputs):
    """Mean of the seed models' float32 outputs, computed in float64 in seed order."""
    acc = outputs[0].astype(np.float64)
    for o in outputs[1:]:
        acc = acc + o.astype(np.float64)
    return acc / len(outputs)


def mlp_to_json(model, **meta):
    return {**meta, "seed": model["seed"], "updates": model["updates"], "rows": model["rows"],
            "people": model["people"],
            "input_mean": [float(v) for v in model["input_mean"]],
            "input_sd": [float(v) for v in model["input_sd"]],
            "layers": [{"weight": [[float(v) for v in row] for row in l["weight"]],
                        "bias": [float(v) for v in l["bias"]]} for l in model["layers"]]}


def load_weight_file(path):
    obj = json.loads(open(path).read())
    if "layers" in obj:
        obj["layers"] = [{"weight": np.asarray(l["weight"], dtype=np.float32),
                          "bias": np.asarray(l["bias"], dtype=np.float32)} for l in obj["layers"]]
        obj["input_mean"] = np.asarray(obj["input_mean"], dtype=np.float64)
        obj["input_sd"] = np.asarray(obj["input_sd"], dtype=np.float64)
    else:
        obj["coefficient"] = np.asarray(obj["coefficient"], dtype=np.float64)
    return obj
